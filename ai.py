import json
import os
from typing import List
from braintrust import traced
from langchain_qdrant import QdrantVectorStore
from openai import OpenAI
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from pydantic import BaseModel
from qdrant_client import QdrantClient
from langchain_core.documents import Document
from qdrant_client.http.models import Distance, VectorParams
from config import settings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from braintrust import init_logger
from braintrust_langchain import BraintrustCallbackHandler, set_global_handler
from langchain_core.prompts import PromptTemplate
# init_logger(project="My Project", api_key=settings.BRAINTRUST_API_KEY)

# handler = BraintrustCallbackHandler()
# set_global_handler(handler)



get_suggestion_prompt = """
You are an expert agriculturalist who has great knowledge about different kinds of noxious weeds and its lifecycle and control methods.
Help a farmer by answering the question about the weed and suggesting him with the best practices to control it. 

The question can be of various types:
1. To identify the weed name with given description like flower_color,flower_posture, bract_type,rosette_present ,leaf_feature,stem_features,habitat.
If the question is to find the weed by given image, Give the common and scientic name of the weed along with the confidence score(0-1).
If the confidence score is <0.4, Mention Unsure
2. To get the correct timing window for treating a weed
3. To get the control methods for a particular weed
The answer should emphasis more on the concern mentioned by the user.
concern: {concern}


The answer should have the below details:
1.Species name 
2.lifecycle_info - Details about type of plant (annual | biennial | perennial), growth stage, timing of growth 
3.control_methods - Details about how to control (method - mechanical | cultural | biological | chemical),description and notes to control, Timing window and effectiveness constraints, What are the effective weedicides availble in the market and its formulations
4.confidence_score - Value ranges between 0-1 where 0 is unsure and 1 is very confident with the given asnwer

Answer the below question in the given output format. 
question:
{question}

Output format: {format_instructions}
"""

class Suggesstion(BaseModel):
    species_name : str
    lifecycle_info: str
    control_methods: str
    confidence_score: float


#@traced(name = 'Review Job Description')
def get_suggestion(question:str, concern:str , image_url : str):
    
    model = ChatOpenAI(model="gpt-5.1",api_key=settings.OPENAI_API_KEY)

    # llm = ChatOpenAI(model="gpt-5.1", temperature=0, api_key=settings.OPENAI_API_KEY)

    output_parser = PydanticOutputParser(pydantic_object=Suggesstion)
    if image_url is None:
        suggestion_prompt = PromptTemplate(template=get_suggestion_prompt,partial_variables={
            "format_instructions": output_parser.get_format_instructions() },)
        
        suggestion_chain = suggestion_prompt | model | output_parser
        suggestion_output = suggestion_chain.invoke({"question": question , "concern":concern })
        


    else:
        suggestion_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant. Return output ONLY in the required format."),
        ("human", [
            {"type": "text", "text": get_suggestion_prompt },
            # this is the image part:
            {"type": "image_url", "image_url": {"url": "{image_data_url}"}}
        ]),
    ]).partial(format_instructions=output_parser.get_format_instructions())
        suggestion_chain = suggestion_prompt | model | output_parser
        suggestion_output = suggestion_chain.invoke({"question": question , "concern":concern ,"image_data_url":image_url})
    



    print(suggestion_output.confidence_score)

    output = Suggesstion(species_name=suggestion_output.species_name,lifecycle_info=suggestion_output.lifecycle_info,control_methods=suggestion_output.control_methods,confidence_score=suggestion_output.confidence_score)
    return output.model_dump_json()
