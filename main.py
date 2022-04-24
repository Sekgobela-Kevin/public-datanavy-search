
from resources_manager import Data_manager
import radial_search_local
import time
import random
import string

#from flask_login import UserMixin

class User(Data_manager, radial_search_local.Answers, radial_search_local.Knowledges):
    """Class for identifying a user on the web"""

    def __init__(self, id, is_db_file):
        super(User, self).__init__(id, is_db_file)
        self.id = id
        radial_search_local.Answers.__init__(self, self.knowledge_json_file_map, self.knowledge_bytes_file_map, self.answers_json_file_map)
        radial_search_local.Knowledges.__init__(self, self.knowledge_json_file_map, self.knowledge_bytes_file_map)
        #print(self.knowledges)


    def get_id(self):
        return self.id

    def used_time(self):
        return time.time() - self.start_time

    def get_questions(self):
        '''all questions in list are returned'''

    def get_knowledge(self, title):
        pass

    def get_answers(self):
        '''returns json with answers'''
        pass

class Searchqueries(object):
    """docstring for Quest."""
    '''{questions:[],knowledge_sources:[]}'''

    def __init__(self, jsonData):
        super(Searchqueries, self).__init__()
        self.jsonData = jsonData
        self.questions = jsonData["questions"]
        self.knowledge_sources = jsonData["knowledges_sources"]

    def get_synced_knowledges_sources(self):
        #unused method(broken)
        synced_sources = self.knowledge_map.keys()
        sources = []
        for source in self.knowledge_sources:
            if source in synced_sources:
                sources.append(source)
        return list(set(sources))


    def get_query(self, question, source="__unknown__"):
        return {"source": source, "text":question, "knowledges_sources": self.knowledge_sources}

    def get_queries(self):
        queries = []
        for question in self.questions:
            queries.append(self.get_query(question))
        return queries




def random_string(range=12):
    rnd = ''.join(random.choices(
        string.ascii_uppercase + string.digits, k=range))
    return rnd


def create_user(session):
    global user, defined
    if "session_id" not in session.keys():
        session["session_id"] = random_string()

    if not defined:
        user = User(session["session_id"])
        defined = True


if __name__ == "__main__":
    start = time.time()
    # User("ekdfhedhfnewjdbfcnwjesdbfjd").sync_all()

    source = "custom text"
    ktext = '''Coding Ground
 Current Affairs
 UPSC Notes Tutors
 Online Tutors
 Whiteboard
 Net Meeting Tutors
 Tutorix Tutors Tutors Tutors
 Login'''
















 # ____________CLOSED++++____________++____________++____________++_________

    user = User("Thato 00018", True)
    data = user.sync_text(source, ktext,save=True)
    print(data)

    ques_text = '''
Online Tutors
 Whiteboard
 Net Meeting Tutors'''

    qq =  {"questions":[ques_text], "knowledges_sources":[ source, "sdesdferdfe"]}
    map_obj = user.knowledge_json_file_map
    qobj = Searchqueries(qq)
    print(qobj.get_queries())


    print(user.get_answers_results(qobj.get_queries(), text_output=True))
    #print(user.knowledges[0].text[0:400])
    #print(user.get_question_obj( "source", "climate").get_synonyms_tokens_groups())
    #print(user.question_sources_avail(ques_text, [ source]))
    user.user_disc_data.get_dict_rows()
    user.knowledge_json_file_map.get_primary_items()
    user.knowledge_json_file_map.get_typed_data()
    user.save_all()
    user.finish_off()


    end = time.time()
    total = end - start
