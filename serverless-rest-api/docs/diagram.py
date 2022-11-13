# type: ignore
from diagrams import Diagram
from diagrams.aws.mobile import APIGateway
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb

with Diagram(show=False):
    APIGateway("REST API") >> Lambda("API handler") >> Dynamodb("Products")