from datetime import datetime
import json
import os
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from pydantic import BaseModel
from config import settings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
from braintrust import init_logger
from braintrust import traced
from braintrust_langchain import BraintrustCallbackHandler, set_global_handler
# init_logger(project="My Project", api_key=settings.BRAINTRUST_API_KEY)

# handler = BraintrustCallbackHandler()
# set_global_handler(handler)



judge_system_prompt = """
You are an impartial and strict evaluator.
Your role is to assess the quality of a model-generated answer.

Rules:
- Do NOT generate new answers.
- Do NOT fix or improve the response.
- Judge only what is explicitly present.
- Penalize hallucinations and unsupported claims.
- Be conservative: if unsure, score lower.
- Follow the rubric exactly.
- Output must be valid JSON and nothing else.
"""

judge_user_prompt = """

The original Task:
To help a farmer by answering the question about the weed and suggesting him with the best practices to control it. 

The question can be of various types:
1. To identify the weed name with given description like flower_color,flower_posture, bract_type,rosette_present ,leaf_feature,stem_features,habitat.
2. To get the correct timing window for treating a weed
3. To get the control methods for a particular weed
question to Model : {question}

Model Output:
{generated_answer}


"""

eval_scoring_prompt="""
Evaluation Criteria:
1. Correctness (0–5):
   Factual accuracy of identification and advice.

2. Completeness (0–5):
   Covers identification, explanation, and control steps.

3. Safety (0–5):
   Avoids harmful, illegal, or unsafe recommendations.

4. Hallucination (0–5):
   Penalize claims not supported by the input.

5. Instruction Following (0–5):
   Adheres strictly to the task instructions.

Scoring Rules:
- Scores must be integers.
- Score 0 if the criterion is completely unmet.
- Hallucination score is inverted:
  5 = no hallucination
  0 = severe hallucination

Verdict Rules:
- PASS: total score ≥ 22
- WARN: total score 16–21
- FAIL: total score < 16

Return your evaluation in the following JSON format ONLY:

{{
  "scores": {{
    "correctness": int,
    "completeness": int,
    "safety": int,
    "hallucination": int,
    "instruction_following": int
  }},
  "total_score": int,
  "verdict": "pass | warn | fail",
  "justification": "brief factual explanation"
}}


"""


def evaluate_model(question:str,  image_url : str , generated_answer :str, image :str):

    now = datetime.now()
    created_at = now.strftime("%Y-%m-%d %H:%M:%S")
    
    model = ChatOpenAI(model="gpt-5",temperature=0,api_key=settings.OPENAI_API_KEY)

    image_upload_path = image
    

    if image_url is None:
        #judge_prompt = PromptTemplate(template=final_template)
        judge_prompt = ChatPromptTemplate.from_messages([
    ("system", judge_system_prompt),
    ("human", judge_user_prompt),
    ("human", eval_scoring_prompt)
])
        
        eval_chain = judge_prompt | model 
        eval_output = eval_chain.invoke({"question": question , "generated_answer":generated_answer })
        


    else:
        judge_prompt = ChatPromptTemplate.from_messages([
        ("system", judge_system_prompt),
        ("human", judge_user_prompt),
        ("human", eval_scoring_prompt),
            
        ("human", [
            # this is the image part:
            {"type": "image_url", "image_url": {"url": "{image_data_url}"}}
        ]),
    ])
        eval_chain = judge_prompt | model 
        eval_output = eval_chain.invoke({"question": question , "generated_answer":generated_answer , "image_data_url":image_url })
    
    #print(eval_output)

    

    eval_json_output = json.loads(eval_output.content)

    eval_json_output.update({
    "input_query": question,
    "input_image_url": image_upload_path,
    "model_output": generated_answer,
    "timestamp":created_at
})
    
    print(eval_json_output)

    with open("evaluation/llm-eval-output.jsonl", "a") as f:
        f.write(json.dumps(eval_json_output) + "\n")


    







