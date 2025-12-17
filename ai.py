import json
import os
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from pydantic import BaseModel
from config import settings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
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
1.Species name - Give the species's common name and scientific name. Provide 2 lines on how it can be identified.
2.lifecycle_info - Details about type of plant (annual | biennial | perennial), growth stage, timing of growth 
3.control_methods - Details about how to control (method - mechanical | cultural | biological | chemical),description and notes to control, Timing window and effectiveness constraints, What are the effective and allowed weedicides availble in the market and its formulations
4.confidence_score - Value ranges between 0-1 where 0 is unsure and 1 is very confident with the given asnwer
5.summary - Summarize the answer based on the given concern in less than 5 lines.
6.disclaimer - Always include a short disclaimer:
"Always follow local regulations and product labels. Consult a licensed professional for site-specific advice."

Answer the below question in the given output format. 
question:
{question}

Output format: {format_instructions}
"""

REVISION_PROMPT = """
You violated one or more policy requirements:
- Never recommend banned herbicides: {banned_list}
- Always include the disclaimer
- Always include confidence_score and control_methods (non-empty)

Rewrite the previous answer to comply. Remove banned herbicides and replace with safe alternatives
(e.g., mechanical/cultural/biological methods or compliant herbicides that are not banned).
Return ONLY in the required output format.
Previous answer:
{previous_json}

Output format: {format_instructions}
"""



BANNED_HERBICIDES = {
    "Aluminum Phosphide",
    "Captafol",
    "DDT",
    "Chlorpyriphos",
    "Carbofuran",
       
}

def contains_banned(text: str) -> list[str]:
    t = (text or "").lower()
    hits = [h for h in BANNED_HERBICIDES if h in t]
    return hits



class Suggesstion(BaseModel):
    species_name : str
    lifecycle_info: str
    control_methods: str
    confidence_score: float
    summary : str
    disclaimer: str

def validate_guardrails(out: Suggesstion) -> None:
    # Always include disclaimer
    if not out.disclaimer or len(out.disclaimer.strip()) < 20:
        raise ValueError("Missing/too short disclaimer")

    # Always show control methods (non-empty)
    if not out.control_methods or len(out.control_methods.strip()) < 20:
        raise ValueError("Missing/too short control_methods")

    # Always show confidence score (range check)
    if out.confidence_score is None or not (0.0 <= out.confidence_score <= 1.0):
        raise ValueError("Invalid confidence_score")

    # Never recommend banned herbicides (scan multiple fields)
    banned_hits = (
        contains_banned(out.control_methods)
        + contains_banned(out.summary)
        + contains_banned(out.lifecycle_info)
        + contains_banned(out.species_name)
    )
    if banned_hits:
        raise ValueError(f"Banned herbicide mentioned: {sorted(set(banned_hits))}")

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
    
    #print(suggestion_output)

    output = Suggesstion(species_name=suggestion_output.species_name,lifecycle_info=suggestion_output.lifecycle_info,control_methods=suggestion_output.control_methods,confidence_score=suggestion_output.confidence_score,summary=suggestion_output.summary,disclaimer=getattr(suggestion_output, "disclaimer", ""))

    try:
        validate_guardrails(output)
    except Exception as e:
        # retry once: ask the model to revise
        revision_parser = PydanticOutputParser(pydantic_object=Suggesstion)
        revision_prompt = PromptTemplate(
            template=REVISION_PROMPT,
            partial_variables={"format_instructions": revision_parser.get_format_instructions()},
        )

        revision_chain = revision_prompt | model | revision_parser
        revised = revision_chain.invoke({
            "previous_json": output.model_dump_json(),
            "banned_list": ", ".join(sorted(BANNED_HERBICIDES)),
        })

        output = Suggesstion(**revised.model_dump())
        validate_guardrails(output)




    return output.model_dump_json()





