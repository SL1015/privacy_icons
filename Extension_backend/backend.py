# This file is the backend of the extension that receives and processes requests from the frontend,
# then send them into the integrated NLP model for analysis.

from urllib import response
from builtins import print
import flask
from flask import render_template, request, jsonify
from flask_cors import CORS
import json
from urllib.parse import unquote, urlparse
import requests
from bs4 import BeautifulSoup
import pymysql

#NLP model packages
import pandas as pd
import numpy as np
import ktrain
from ktrain import text
from sklearn.model_selection import train_test_split
import torch
import re
import nltk
from nltk import sent_tokenize
import json 
from transformers import *
import torch.nn.functional
import torch



#FLASK CONFIG
app = flask.Flask(__name__)
cors = CORS(app)

@app.route('/query', methods=['GET','POST'])
def searchurl():
     #GET the privacy policy URL from frontend
    url = ''
    url = unquote(request.args.get('query'))
    with open('annotations.json', 'r') as f:
        content = json.load(f)
    
    weblist = content['websites']
    flag = 0
    for v in weblist:
        if v['domain'] == url:
            result = v['annotations']
            flag = 1
            print(result)
        
    if flag == 0:
        s = "no"
        return json.dumps(s)
    else:
        return json.dumps(result)
    
@app.route('/', methods=['GET','POST'])
def geturl():   
    #GET the privacy policy URL from frontend
    url = ''
    url = unquote(request.json.get('analyze'))
    with open('annotations.json', 'r') as f:
        content = json.load(f)
    
    weblist = content['websites']
    if not any(v['privacy_policy_url'] == url for v in weblist):
        print("not process yet")
        input_text = downloadhtml(url)
        # LOAD MODELS (-- change path!)
        all_icons = model_load(input_text) 

        # SAVE ICONS INTO A CSV FILE 
        domain = urlparse(url)
        domain_url = domain.netloc
        info_dict = {'domain': domain_url, 'privacy_policy_url':url, 'annotations': all_icons}
        print("info_dict: ",info_dict)
        weblist.append(info_dict)
        print("content:", content)
        with open('annotations.json', 'w') as json_file:
            json.dump(content, json_file,  indent=4)
            print("write json success")
        
        # SAVE INTO MYSQL DB
        save2DB(info_dict)
        return "success"
     
    else:
        print("pass")
        return "This webiste has already been analyzed"

def save2DB(info_dict):   
    # create a empty string di
    di = ""

    # Convert the data values in the dictionary to a comma-separated string for the insertion of the entire row below
    for i in info_dict.keys():
        di = (di + '"%s"' + ",") % (info_dict[i])

    db = pymysql.connect(host="localhost", user="ppiuser", password="Eiqu4eos", db="ppi_db")
    # create a cursor object
    cur = db.cursor()
    sql1 = "INSERT INTO testppi VALUES (%s)" % (di[:-1])
    cur.execute(sql1)
    cur.connection.commit()  
    db.close()
   
#download the html
def downloadhtml(url):
    if(url):
        r = requests.get(url)
        soup = BeautifulSoup(r.text, 'html.parser')
        text = soup.find_all(text=True)
        output = ''
        blacklist = [
            '[document]',
            'noscript',
            'header',
            'html',
            'meta',
            'head', 
            'input',
            'script',
            'style'# there may be more elements you don't want, such as "style", etc.
        ]
        for t in text:
            if t.parent.name not in blacklist:
                output += '{} '.format(t)

    return output

#MODEL LOAD
def model_load(input_text):

    predictor = ktrain.load_predictor('model')
    columnnames = ['General Data', 'Financial Data', 'Health Data', 'Location Data', 'Biometric Data', 'Intimate Data', 'Provided Data', 'Collected Data', 'Received Data', 'Marketing', 'Product Development', 'Other', 'Automated Decision Making', 'Profiling', 'Data Transfer', 'Data Sale', 'No Data Transfer', 'No Data Sale']

    # ADD DOMAIN AND INPUT TEXT (-- change placeholder to correct domain and text!)
    #domain = "https://www.zalando.ch/zalando-datenschutz/"

    #input_text = 'Zalando offers you a wide variety of services that you can use in different ways. Depending on whether you contact us online, by telephone, in person or in some other way and which services you use, different data from different sources are collected. You provide us with much of the data that we process yourself when you use our services or contact us, for example when you register and provide your name, e-mail address or postal address. However, we also receive technical device and access data that we automatically collect when you interact with our services. This can, for example, be information about which device you are using. We collect further data through our own data analyzes (e.g. as part of market research studies and through evaluations by customers). We may also receive data about you from third parties, for example from credit agencies and payment service providers.'

    # START PIPELINE 
    sentences = preprocessing(input_text)
    all_icons = get_classes(sentences, predictor)

    return all_icons

# ALL FUNCTIONS USED TO RUN MODEL 
def get_classes(sentences, predictor): 
  ''' 
  Input: Sentences, type: list / predictor (pretrained and saved model)
  Process: Checks for each label if its probability is once (over the whole text) over the threshold --> if yes, annotate label 
  Output: found annotations 
  '''

  occuring_classes = [] # list to save all labels with a probability that was high enough 
 
  probs = run_model(sentences, predictor) # return probabilities as numpy array  
  columnnames = ['General Data', 'Financial Data', 'Health Data', 'Location Data', 'Biometric Data', 'Intimate Data', 'Provided Data', 'Collected Data', 'Received Data', 'Marketing', 'Product Development', 'Other', 'Automated Decision Making', 'Profiling', 'Data Transfer', 'Data Sale', 'No Data Transfer', 'No Data Sale']
 
  for label in columnnames: # go through all labels 
    index = columnnames.index(label) # get index of label 
    
    # check if any value in column of given label is greater than threshold 
    if label in ['General Data', 'Marketing', 'Data Sale'] and np.any(probs[:, index] >= 40):
      occuring_classes.append(label)

    elif label in ['Received Data', 'Automated Decision Making'] and np.any(probs[:, index] >= 10):
      occuring_classes.append(label)
    
    elif label in ['Location Data', 'Intimate Data'] and np.any(probs[:, index] >= 98):
        occuring_classes.append(label)
    
    elif label in ['Other', 'Health Data'] and np.any(probs[:, index] >= 70):
        occuring_classes.append(label)

    elif label in ['Data Transfer'] and np.any(probs[:, index] >= 80):
      occuring_classes.append(label)

    elif label in ['Biometric Data'] and np.any(probs[:, index] >= 80):
        occuring_classes.append(label)

    elif label in ['Product Development'] and np.any(probs[:, index] >= 60):
        occuring_classes.append(label)

    elif label in ['Profiling'] and np.any(probs[:, index] >= 50):
        occuring_classes.append(label)

    elif label in ['Collected Data', 'Financial Data'] and np.any(probs[:, index] >= 5):
        occuring_classes.append(label)

    elif label in ['No Data Transfer'] and np.any(probs[:, index] >= 30):
          occuring_classes.append(label)

    elif label in ['No Data Sale'] and np.any(probs[:, index] >= 1):
      occuring_classes.append(label)

    elif label in ['Provided Data'] and np.any(probs[:, index] >= 0.6):
      occuring_classes.append(label)

  all_occ_classes = list(set(occuring_classes)) # save each category only once in a list 

  # Data Transfer/Sale and No Data Transfer/Sale can't co-occurr in a text (always keep Data Transfer/Sale if both present in text )
  if 'Data Transfer' and 'No Data Transfer' in all_occ_classes:
    all_occ_classes.remove('No Data Transfer')
  
  if 'Data Sale' and 'No Data Sale' in all_occ_classes:
    all_occ_classes.remove('No Data Sale')

  return all_occ_classes


def preprocessing(text): 
  ''' 
  input: text, type: string
  preprocessing: remove new lines from text 
  return: sentences, type: list 
  '''

  clean_text = text.replace('\n', ' ') # remove new lines from text 
  sentences = sent_tokenize(clean_text) # tokenize text into sentences 

  return sentences 

# Quantization with PyTorch
def run_model(sentences, predictor): 
  ''' 
  input: sentences, type: list
  preprocessing: remove new lines from text 
  return: predicted probability of each category as numpy array of dimension (# sentences , # categories (=18)), type: numpy 
  '''

  # load model and tokenizer from predictor 
  model_pt = AutoModelForSequenceClassification.from_pretrained('model', from_tf=True)
  tokenizer = predictor.preproc.get_tokenizer()
  maxlen = predictor.preproc.maxlen # get maxlen from predictor 
  device = 'cpu'
  class_names = predictor.preproc.get_classes() # get class names 

  # quantize model (INT8 quantization) to make it faster 
  model_pt_quantized = torch.quantization.quantize_dynamic(
      model_pt.to(device), {torch.nn.Linear}, dtype=torch.qint8)

  # make quantized predictions (sentences is a list of all sentences)
  first_iter = True 
  for sentence in sentences: # go through all sentences and apply model 
      model_inputs = tokenizer(sentence, return_tensors="pt", max_length=maxlen, truncation=True)
      model_inputs_on_device = { arg_name: tensor.to(device) 
                                for arg_name, tensor in model_inputs.items()}
      output = model_pt_quantized(**model_inputs_on_device)
      logits = output[0] # output of model is in logits 
      probabilities = torch.nn.functional.softmax(logits) # convert logits to softmax 
      probs = probabilities.cpu().detach().numpy()  # convert tensor to numpy array for further calculations 
      #probs = np.squeeze(probs)

      rounded_probs = np.round_(np.multiply(probs, 100),1) # round probabilities and multiply them by 100 to read 
      if first_iter: # in case of first iteration = first sentences: make numpy array to save all rounded probabilities  
        preds = rounded_probs 
        first_iter = False 
      else: 
        preds = np.concatenate((preds, rounded_probs)) # add prediction of new sentences to the already predicted sentences 

  return preds 


#APP RUNSERVER
if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=8000)#
