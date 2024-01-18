from math import ceil
from types import SimpleNamespace
from telegram.constants import ParseMode
from telegram.ext import ApplicationBuilder
from shared.config import *
from typing import Annotated
from fastapi import FastAPI
from fastapi import Depends, File, HTTPException, status, Body, Form
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from starlette.requests import Request
from fastapi.middleware.cors import CORSMiddleware
import json
from bson import ObjectId
from shared import connect_to_mongo, close_mongo_connection, parse_json, s3, generate_unique_filename, \
    create_crud_routes
from shared.orm import *

telegram_bot = ApplicationBuilder().token(TELEGRAM_TOKEN).build()


async def notify_users(subs, data):
    warn_msgs = ['- повреждение вайпера', '- ошибка распыления порошка']
    msg = ['*Ошибка печати*']

    for warn in data['warns']:
        msg.append(warn_msgs[warn.get('reason')])

    photos = []

    if data.get('svg_image'):
        photos.append(SimpleNamespace(**{'type': 'photo', 'media': data['svg_image'], 'caption': 'svg'}))

    if data.get('before_melting_image'):
        photos.append(SimpleNamespace(**{'type': 'photo', 'media': data['before_melting_image'], 'caption': 'до плавления'}))

    if data.get('after_melting_image'):
        photos.append(SimpleNamespace(**{'type': 'photo', 'media': data['after_melting_image'], 'caption': 'после плавления'}))

    for sub in subs:
        text = "\n".join(msg) + '\n\n'

        if len(photos) != 0:
            text += '*Фотографии*\n'
            for photo in photos:
                text += f"[- {photo.caption}](https://google.com)\n"

        if sub.get("telegram_chat_id"):
            await telegram_bot.bot.send_media_group(
                chat_id=sub["telegram_chat_id"],
                media=photos,
                caption=text,
                parse_mode=ParseMode.HTML,
            )


app = FastAPI()


@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    return response


create_crud_routes(User, "users", app)
create_crud_routes(Printer, "printers", app)


# @app.post(f"/add_printer_for_user/{{user_id}}/")
# async def add_printer_for_user(user_id: str, printer: int, db: AsyncIOMotorDatabase = Depends(connect_to_mongo)):
#     result = await db['users'].find_one({"_id": ObjectId(user_id)})
#
#     if not result['printers']:
#         result['printers'] = []
#
#     result['printers'].append(printer)
#     await db['users'].find_one_and_update({"_id": ObjectId(user_id)}, {"$set": {"printers": result['printers']}})
#
#     return JSONResponse(content={"printers": result.printers}, status_code=status.HTTP_200_OK)


@app.get(f"/get_printers_for_user/{{user_id}}/")
async def get_printers_for_user(user_id: str, db: AsyncIOMotorDatabase = Depends(connect_to_mongo)):
    subs = await db['subs'].find({"user_id": ObjectId(user_id)}).to_list(length=1000)
    printers = []

    ## TODO: add pagination
    for sub in subs:
        printer_result = await db['printers'].find_one({"uid": sub['printer_uid']})

        if not (printer_result is None):
            printers.append(parse_json(printer_result))

    return JSONResponse(content={"printers": printers}, status_code=status.HTTP_200_OK)


@app.post(f"/create_layer")
async def create_layer(
        order: Annotated[int, Body()],
        project_id: Annotated[str, Body()],
        warns: Annotated[Optional[List[Any]], Body()],
        db: AsyncIOMotorDatabase = Depends(connect_to_mongo)
):
    try:
        project = await db['projects'].find_one({"_id": ObjectId(project_id)})
        if not project:
            raise HTTPException(status_code=414, detail=f"Project not found")

        new_warns = []

        if warns:
            for warn in warns:
                new_warns.append({
                    'rate': float(warn.get('rate')),
                    'reason': warn.get('reason')
                })

        response = {
            "warns": new_warns,
            "project_id": project_id,
            "order": order,
            "printer_uid": project["printer_uid"]
        }

        result = await db["layers"].insert_one(json.loads(json.dumps(response)))
        inserted_id = str(result.inserted_id)
        response_content = {**response, "id": inserted_id}

        return JSONResponse(content=response_content, status_code=status.HTTP_200_OK)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)  # except:


@app.post(f"/add_photos_to_layer")
async def add_photos_to_layer(
        layer_id: Annotated[str, Form()],
        before_melting_image: Optional[UploadFile] = File(None),
        after_melting_image: Optional[UploadFile] = File(None),
        svg_image: Optional[UploadFile] = File(None),
        db: AsyncIOMotorDatabase = Depends(connect_to_mongo)
):
    layer = await db['layers'].find_one({"_id": ObjectId(layer_id)})

    if not layer:
        raise HTTPException(status_code=413, detail=f"Layer not found")

    response = {**layer}
    if before_melting_image:
        file_name = generate_unique_filename(before_melting_image.filename)
        s3.upload_fileobj(before_melting_image.file, S3_BUCKET_PICS, file_name)
        response['before_melting_image'] = f'/{S3_BUCKET_PICS}/{file_name}'
    if after_melting_image:
        file_name = generate_unique_filename(after_melting_image.filename)
        s3.upload_fileobj(after_melting_image.file, S3_BUCKET_PICS, file_name)
        response['after_melting_image'] = f'/{S3_BUCKET_PICS}/{file_name}'
    if svg_image:
        file_name = generate_unique_filename(svg_image.filename)
        s3.upload_fileobj(svg_image.file, S3_BUCKET_PICS, file_name)
        response['svg_image'] = f'/{S3_BUCKET_PICS}/{file_name}'

    if layer['warns'] is not None and len(layer['warns']) != 0:
        users = await db["subs"].find({"printer_uid": layer["printer_uid"]}).to_list(length=1000)
        await notify_users(users, response)

    return JSONResponse(content=parse_json(response), status_code=status.HTTP_200_OK)


@app.get(f"/get_all_projects_for_printer/{{printer_uid}}")
async def get_all_projects_for_printer(
        printer_uid: str,
        page: Optional[int] = 1,
        limit: Optional[int] = 10,
        db: AsyncIOMotorDatabase = Depends(connect_to_mongo)
):
    try:
        if page < 1 or limit < 1:
            raise ValueError("Invalid page or limit value")

        total_projects = await db["projects"].count_documents({"printer_uid": printer_uid})
        total_pages = ceil(total_projects / limit)

        cursor = db["projects"].find({"printer_uid": printer_uid}).skip((page - 1) * limit).limit(limit)
        result = [parse_json(doc) for doc in await cursor.to_list(length=limit)]

        return JSONResponse(
            content={"results": result, "total_pages": total_pages, "current_page": page, "size": total_projects},
            status_code=status.HTTP_200_OK
        )
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)  # except:


@app.get("/subscribe_for_printer")
async def subscribe_for_printer(
        printer_uid: str,
        user_id: str,
        db: AsyncIOMotorDatabase = Depends(connect_to_mongo)
):
    try:
        user = await db['users'].find_one({"_id": ObjectId(user_id)})
        await db['subs'].find_one_and_update(
            {"user_id": ObjectId(user_id), "printer_uid": printer_uid},
            {'$set': {"user_id": ObjectId(user_id), "printer_uid": printer_uid,
                      "telegram_chat_id": user["telegram_chat_id"]}},
            upsert=True
        )
        return {"message": "Subscription created/updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/unsubscribe_from_printer")
async def unsubscribe_from_printer(
        printer_uid: str,
        user_id: str,
        db: AsyncIOMotorDatabase = Depends(connect_to_mongo)
):
    try:
        result = await db['subs'].delete_one(
            {"user_id": ObjectId(user_id), "printer_uid": printer_uid}
        )
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Subscription not found")
        return {"message": "Unsubscribed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"/get_all_layers_for_project/{{project_id}}")
async def get_all_layers_for_project(
        project_id: str,
        page: Optional[int] = 1,
        limit: Optional[int] = 10,
        db: AsyncIOMotorDatabase = Depends(connect_to_mongo)
):
    try:
        if page < 1 or limit < 1:
            raise ValueError("Invalid page or limit value")

        layers = await db["layers"].count_documents({"project_id": project_id})
        total_pages = ceil(layers / limit)

        cursor = db["layers"].find({"project_id": project_id}).skip((page - 1) * limit).limit(limit)

        result = [parse_json(doc) for doc in await cursor.to_list(length=limit)]

        return JSONResponse(
            content={"results": result, "total_pages": total_pages, "current_page": page, "size": layers},
            status_code=status.HTTP_200_OK
        )
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)  # except:


# TODO: add delete layer handler
create_crud_routes(Project, "projects", app)
