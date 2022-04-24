'''Date: 2021 May 13'''


import main
import flask_operations
import radial_search_local
import users_resources
import config

from flask import Flask
from flask import render_template
from flask import session
from flask import request
from flask import g
from flask import url_for
from flask import redirect
from flask import abort
#from multiprocessing.managers import BaseManager
import json


app = Flask(__name__)
app.secret_key = 'TF65H&4DCe@94HGR$gREh#74tf'
app.config["SESSION_PERMANENT"] = False

# set this as cookie  in browser
# visit /sessions/set_session/<session_value> to access session
# this would give access to session in <session_value>
# /sessions/go_back would return back to original session
# only maintainer has access to sessions_ids
# this was for development and testing of client
session_access_value = "Yrhahysgdbedvsgdbfhbsegdvfgebsdyhb"


'''@app.before_first_request
def before_first_request_func():
    session.permanent = True
'''

@app.before_request
def before_request_func():
    prohibited_paths = ['.js', '.css', '.htm', '.html', '/static/']

    #dont execute if requesting for file or homepage
    for path_item in prohibited_paths:
        if path_item in request.path:
            return
    if "user_id" not in session:
        while True:
            users_obj = users_resources.Users()
            user_id = main.random_string()
            if not users_obj.user_exists(user_id):
                session["user_id"] = user_id
                break
    g.user = main.User(session["user_id"], True)



'''@app.after_request
def after_request_func(response):
    return response
'''

@app.teardown_request
def teardown_request_func(error=None):
    try:
        g.user.finish_off()
    except:
        pass


@app.route('/', methods=["GET"])
def home():
    return render_template('/questions_answers/questions_answers.html', js_files_folder=config.js_files_folder)

@app.route('/sessions/set_session/<session_value>', methods=["GET"])
def set_session(session_value):
    users_obj = users_resources.Users()

    if not users_obj.user_exists(session_value):
        abort(401)

    if "session_access_allot" in request.cookies:
        value = request.cookies.get("session_access_allot")
        if value == session_access_value:
            session["user_id_backed"] = session["user_id"]
            session["user_id"] = session_value
            return redirect(url_for('home'))
        else:
            abort(401)
    else:
        abort(403)

@app.route('/sessions/go_back', methods=["GET"])
def session_back():
    if "user_id_backed" in session:
        session["user_id"] = session["user_id_backed"]
    return redirect(url_for('home'))


@app.route('/guide', methods=["GET"])
def guide():
    return render_template('tutorial.html')


@app.route('/en/analysis', methods=["POST", "GET"])
def eng_analysis():
    if request.method == 'POST':
        qobjs = [radial_search_local.Question('', text) for text in request.json]
        dict_data = {qobj.get_text(): qobj.get_as_dict() for qobj in qobjs}
        return json.dumps(dict_data)


@app.route('/knowledge/apload/files', methods=["POST"])
def knowledge_files_apload():
    if request.method == 'POST':
        json_file_map = g.user.knowledge_json_file_map
        files_upload_obj = flask_operations.Files(request, json_file_map)
        filesnames_map = files_upload_obj.get_filesnames_map()
        files_upload_obj.save_all(g.user.knowledge_files_path)

        extracted_data_dict = g.user.sync_knowledge_files(filesnames_map, save=True)
        print("done /knowledge/apload/files")
        json_file_map.concat(extracted_data_dict)
        return json.dumps(extracted_data_dict)


@app.route('/knowledge/apload/text', methods=["POST"])
def knowledge_text_apload():
    print('/knowledge/apload/text request')

    if request.method == 'POST':
        json_file_map = g.user.knowledge_json_file_map
        extracted_data_dict = g.user.sync_texts(request.json, save=True)
        json_file_map.concat(extracted_data_dict)
        return json.dumps(extracted_data_dict)


@app.route('/knowledge/apload/urls', methods=["POST"])
def knowledge_urls_apload():
    print('/knowledge/apload/urls request')
    if request.method == 'POST':
        json_file_map = g.user.knowledge_json_file_map
        extracted_data_dict = g.user.sync_urls(request.json, save=True)
        #extracted_data_dict = g.user.knowledge_json_file_map.get_specific_items(request.json)
        json_file_map.concat(extracted_data_dict)
        return json.dumps(extracted_data_dict)


@app.route('/knowledge/process', methods=["POST"])
def knowledge_process_to_bytes():
    if request.method == 'POST':
        k_objs = g.user.get_knowledges_objs(request.json)
        sources = [k_obj.get_source() for k_obj in k_objs]
        print(sources, '/knowledge/process output')
        return json.dumps(sources)



@app.route('/answers/non-interactive/results', methods=["POST", "GET"])
def answers_non_interactive_results():
    print("answers_non_interactive_results request")
    if request.method == 'POST':
        queries_obj = main.Searchqueries(request.json)
        return json.dumps(g.user.get_answers_results(queries_obj.get_queries()))




#queries handling

@app.route('/knowledge/reload', methods=["POST", "GET"])
def knowledge_reload():
    if request.method == 'POST' or request.method == "GET":
        #typed mean that type of knowledge is included
        loaded_typed = g.user.knowledge_json_file_map.get_typed_data()
        processed_sources = g.user.knowledge_bytes_file_map.get_primary_items()
        for element in loaded_typed:
            if element["source"] in processed_sources:
                element["processed"] = True
            else:
                element["processed"] = False
        return json.dumps(loaded_typed)

@app.route('/knowledge/pull_sources', methods=["POST"])
def knowledge_pull_sources():
    if request.method == 'POST':
        json_map = g.user.knowledge_json_file_map
        json_map.overide_map(request.json)
        return json.dumps(json_map.get_keys())

@app.route('/knowledge/push', methods=["POST"])
def knowledge_push():
    if request.method == 'POST':
        json_map = g.user.knowledge_json_file_map
        json_map.overide_map(request.json)
        return json.dumps(json_map.get_map())

@app.route('/knowledge/pull', methods=["POST"])
def knowledge_pull():
    if request.method == 'POST':
        json_map = g.user.knowledge_json_file_map
        json_map.db_sync(request.json)
        #all items in map are need no need for filter
        return json.dumps(json_map.get_map())

@app.route('/knowledge/delete', methods=["POST"])
def knowledge_delete():
    if request.method == 'POST':
        resources_data = [g.user.knowledge_json_file_map, g.user.knowledge_bytes_file_map]
        for resource_data in resources_data:
            assert request.json, "request is empty"
            resource_data.delete_specific(resource_data.primary_column, request.json)
    return ""

if __name__ == '__main__':
    #app.debug = True
    app.run()
