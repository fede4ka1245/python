import pika
from .config import RABBIT_MQ_HOST


def get_connection():
    credentials = pika.PlainCredentials('rmuser', 'rmpassword')
    connection = pika.BlockingConnection(pika.ConnectionParameters(RABBIT_MQ_HOST, 5672, credentials=credentials))
    return connection