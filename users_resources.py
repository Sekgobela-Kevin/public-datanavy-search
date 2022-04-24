import main
import config

import directories
import os
import time
import datetime

from urllib.request import Request


class Virtual_user(main.User):
    """docstring for Virtual_user."""

    def __init__(self, id):
        super(Virtual_user, self).__init__(id, True)
        self.user_disc_data.sync_all()
        #done accessing database
        #print(self.user_disc_data.get_dict_rows())
        #print(self.user_disc_data.load_all(), "load_all()")
        #print(self.user_disc_data.get_map(), "get_map()")
        #print(self.get_used_time())
        self.close_db()

    def is_user_data_empty(self):
        return self.user_disc_data.is_map_empty()

    def get_last_time(self):
        return float(self.user_disc_data.get_value("end_time"))

    def get_start_time(self):
        return float(self.user_disc_data.get_value("start_time"))

    def get_used_time(self):
        return self.get_last_time() - self.get_start_time()

    def get_inactive_time(self):
        return self.access_time - self.get_last_time()

    def delete_knowledges_bytes(self, sources=None):
        if sources==None:
            self.knowledge_bytes_file_map.delete_all()
        else:
            self.knowledge_bytes_file_map.delete_specific(sources)

    def delete_knowledges_text(self, sources):
        if sources==None:
            self.knowledge_json_file_map.delete_all()
        else:
            self.knowledge_json_file_map.delete_specific(sources)

    def ratio_delete_knowledges_bytes(self, ratio):
        assert ratio <= 1 and ratio >= 0, f"ration is out of range {ratio}"
        self.knowledge_bytes_file_map.ration_delete(ratio)

    def ratio_delete_knowledges_text(self, ratio):
        assert ratio <= 1 and ratio >= 0, f"ration is out of range {ratio}"
        self.knowledge_json_file_map.ration_delete(ratio)

class Users(object):
    """docstring for Users."""

    def __init__(self):
        super(Users, self).__init__()
        module_folder = os.path.dirname(os.path.abspath(__file__))
        self.users_path = os.path.join(module_folder, 'users')
        #self.users_path = users_path
        self.users_paths = self.get_folders_paths()

    def get_users_objs(self):
        return [Virtual_user(self.get_id(path)) for path in self.users_paths]

    def get_folders_paths(self):
        return directories.get_folders(self.users_path)

    def get_id(self, path):
        #uses user path but database could be used
        return directories.get_folder_name(path)

    def get_path(self, user_id):
        return os.path.join(self.users_path,user_id)

    def user_exists(self, user_id):
        if self.get_path(user_id) in self.users_paths:
            return True
        else:
            return False

    def get_total_users(self):
        return len(self.users_paths)

    def delete_user(self, user_id):
        if self.user_exists(user_id):
            directories.delete_dir(self.get_path(user_id))

    def delete_users(self):
        for path in self.users_paths:
            directories.delete_dir(path)

    def users_loop(self, callback):
        for user_obj in self.get_users_objs():
            callback(user_obj)

    def get_seconds(self, seconds=None, minutes=None, hours=None, days=None, weeks=None):
        if seconds != None:
            seconds = seconds
        elif minutes != None:
            seconds = minutes * 60
        elif minutes != None:
            seconds = datetime.timedelta(minutes = minutes)
        elif hours != None:
            seconds = hours * 3600
        elif days != None:
            seconds = days * (3600*24)
        elif weeks != None:
            seconds = weeks * (3600*24*7)
        else:
            assert False, "cannot compute seconds without input(minutes, hours, days)"
        return seconds

    def delete_by_inactive_time(self, seconds=None, minutes=None, hours=None, days=None, weeks=None):
        input_seconds = self.get_seconds(seconds=seconds, minutes=minutes,
            hours=hours, days=days, weeks=weeks)
        def callback(user_obj):
            if user_obj.get_inactive_time() > input_seconds:
                print(user_obj.get_inactive_time(), input_seconds)
                self.delete_user(user_obj.get_id())
        self.users_loop(callback)




if __name__ == "__main__":
    users_obj = Users()
    users_obj.delete_by_inactive_time(hours=config.delete_inactive_time)
    Request("https://www.datanavy.site/", headers={'User-Agent': 'Mozilla/5.0'})
