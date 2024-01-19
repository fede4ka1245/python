import pika
from .config import RABBIT_MQ_HOST


def connect_rabbitmq():
    credentials = pika.PlainCredentials('rmuser', 'rmpassword')
    return pika.BlockingConnection(pika.ConnectionParameters(RABBIT_MQ_HOST, 5672, credentials=credentials))
