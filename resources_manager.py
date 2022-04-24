import directories
import file
import os
import time


class Base_data(object):
    """docstring for Base_data."""

    def __init__(self, id, is_db_file):
        # super(Base_data, self).__init__()
        self.id = id
        self.is_db_file = is_db_file
        # Cross platform path(credits: pythonanywhere)
        module_folder = os.path.dirname(os.path.abspath(__file__))
        self.users_path = os.path.join(module_folder, 'users')
        self.root_path = os.path.join(self.users_path, self.id)

        self.db_file_path = os.path.join(self.root_path, "user.db")

        self.knowledge_path = os.path.join(self.root_path, "knowledge")
        self.knowledge_files_path = os.path.join(self.knowledge_path, "files")
        self.knowledge_json_path = os.path.join(self.knowledge_path, "json")
        self.knowledge_json_file_path = os.path.join(
            self.knowledge_json_path, "knowledge_text.json")
        self.knowledge_bytes_path = os.path.join(self.knowledge_path, "bytes")
        self.knowledge_bytes_file_path = os.path.join(
            self.knowledge_bytes_path, "knowledges_objs.pc")

        self.questions_path = os.path.join(self.root_path, "questions")
        self.questions_json_path = os.path.join(self.questions_path, "json")
        self.questions_json_file_path = os.path.join(
            self.questions_json_path, "questions.json")

        self.answers_path = os.path.join(self.root_path, "answers")
        self.answers_json_path = os.path.join(self.answers_path, "json")
        self.answers_json_file_path = os.path.join(
            self.answers_json_path, "answers.json")

        if self.root_path not in directories.get_folders(self.users_path):
            self.create_resources()

        self.db_obj = self.get_db()
        self.db_conn = self.db_obj.get_conn()

    def get_db(self):
        if self.is_db_file:
            return file.DB_file(self.db_file_path)
        else:
            return file.DB_file(None, False)

    def create_folders(self):
        '''Code for creating folders for user resources'''
        paths = [
            self.root_path, self.knowledge_path, self.knowledge_json_path, self.knowledge_files_path, self.questions_path,  self.questions_json_path,  self.answers_path,  self.answers_json_path, self.knowledge_bytes_path]
        for path in paths:
            directories.create_dir(path)

    def create_files(self):
        paths = [self.knowledge_json_file_path,  self.questions_json_file_path,
                 self.answers_json_file_path, self.knowledge_bytes_file_path,
                 self.db_file_path]
        for path in paths:
            directories.create_file(path)

    def create_resources(self):
        self.create_folders()
        self.create_files()

    def remove_folders(self):
        directories.delete_dir(self.root_path)

    def commit_db(self):
        self.db_conn.commit()

    def create_conn(self):
        self.db_conn = self.db_obj.get_conn()

    def close_db(self):
        self.commit_db()
        self.db_obj.close()


class Sync_knowleges():
    """docstring for Sync."""

    def __init__(self, json_file_map, files_path):
        #super(Sync_files, self).__init__()
        self.knowledge_json_file_map = json_file_map
        self.extensions_classes_map = {".pdf": file.Pdf_to_text, ".docx": file.Docx_to_text, ".doc": file.Docx_to_text,
                                       ".pptx": file.Pptx_to_text, ".ppt": file.Pptx_to_text, "text": file.Text_file_to_text, }
        self.files_path = files_path

    def secure_to_original_filename(self, secure_filename, filesnames_map):
        if secure_filename in filesnames_map:
            return filesnames_map[secure_filename]

    def is_synced(self, identity, identity_type="file_path", filesnames_map=None):
        '''identity_type = "file_path" | "map_key"'''
        assert identity_type == "file_path" or identity_type == "map_key", f"indentity of {identity_type} not recognized"
        if identity_type == "file_path":
            assert filesnames_map != None, "filesnames_map not provided for looking file_path"
            filename = directories.get_filename_extension(identity)
            map_key = self.secure_to_original_filename(
                filename, filesnames_map)
        elif identity_type == "map_key":
            map_key = identity
        return self.knowledge_json_file_map.is_key_avail(map_key)

    def get_files_paths(self):
        return directories.files_paths(self.files_path)

    def is_extension_supported(self, extension):
        return extension in self.extensions_classes_map

    def get_convert_obj(self, path):
        is_text_file = self.extensions_classes_map["text"](path).is_valid()
        if is_text_file:
            # text files has priority incase binary file extension contains text
            return self.extensions_classes_map["text"](path)
        extension = directories.get_file_extension(path)
        assert self.is_extension_supported(
            extension), f"{extension}, seems not to be supported"
        return self.extensions_classes_map[extension](path)

    def get_text(self, path):
        assert path, f"{path}, is not path"
        convert_obj = self.get_convert_obj(path)
        # file contends may not match its file extensions_classes_map
        # Never trust user in terms of filenames and extension
        if convert_obj.is_valid():
            return convert_obj.get_text()

    def get_text_opt(self, path=None, filesnames_map=None):
        '''optimized version of get_text() method(files level)'''
        assert path, f"{path}, is not path"
        filename = directories.get_filename_extension(path)
        original_filename = self.secure_to_original_filename(
            filename, filesnames_map)
        if self.knowledge_json_file_map.is_key_avail(original_filename):
            return self.knowledge_json_file_map.get_value(original_filename)
        else:
            assert filesnames_map!=None, "filesnames_map is required as resource not synced"
            assert path!=None, "path is required as resource not synced"
            return self.get_text(path)

    def add_to_sync(self, original_filename, text):
        self.knowledge_json_file_map.append(original_filename, text)
        assert self.knowledge_json_file_map.is_key_avail(
            original_filename), "Extracted data not available after being added to map"

    def sync(self, path, filesnames_map=None, save=False):

        text = self.get_text_opt(path, filesnames_map)
        if text:
            filename = directories.get_filename_extension(path)
            secure_filename = filename
            #useful if file not synced
            if filesnames_map != None:
                filename = self.secure_to_original_filename(
                    filename, filesnames_map)
                assert filename != None, f"{secure_filename} filename was not found even if text found. Possibly caused by filenames map missing neccesary key and value or another error."

            print(path, "----  Was just synced")
            return {filename: text}

    def remove_old_files(self, minutes=10):
        for path in self.get_files_paths():
            modified_time = os.path.getmtime(path)
            if (time.time() - modified_time) >  minutes*60:
                directories.remove_file(path)

    def sync_all(self, filesnames_map, save=False, remove=False):
        synced = {}
        for path in self.get_files_paths():
            filename = directories.get_filename_extension(path)
            original_filename = self.secure_to_original_filename(filename, filesnames_map)
            if self.knowledge_json_file_map.is_key_avail(original_filename):
                value = self.knowledge_json_file_map.get_value(original_filename)
                assert value != None, "value is none"
                sync  = {original_filename: value}
                synced = {**synced, **sync}
                continue
            elif filename in filesnames_map.keys():
                sync = self.sync(path, filesnames_map=filesnames_map, save=save)
                if sync != None:
                    synced = {**synced, **sync}
        return synced

    def sync_by_source(self, source):
        self.knowledge_json_file_map.db_sync(source)
        if self.knowledge_json_file_map.is_key_avail(source):
            return {source: self.knowledge_json_file_map.get_value(source)}

    def sync_by_sources(self, sources):
        synced = {}
        for source in sources:
            sync =  self.sync_by_source(source)
            if sync != None:
                synced = {**synced, **sync}
        return synced

    def sync_knowledge_files(self, filesnames_map, save=False):
        sources_sync = self.sync_by_sources(filesnames_map.values())
        files_sync = self.sync_all(filesnames_map=filesnames_map, save=save)
        return {**sources_sync, **files_sync}

    def sync_url(self, url, save=False):
        source_sync = self.sync_by_source(url)
        if source_sync != None:
            return source_sync
        else:
            convert_obj = file.Url_to_text(url)
            if convert_obj.is_valid():
                text = convert_obj.get_text()
                if text:
                    sync = {url: text}
                    self.knowledge_json_file_map.concat(sync)
                    return sync

    def sync_urls(self, urls, save=False):
        synced = {}
        for url in urls:
            sync = self.sync_url(url, save)
            if sync:
                synced = {**synced, **sync}
        return synced

    def sync_text(self, source, text, save=False):
        #no need to load from json_knowledge_map
        assert source and text, "something wrong with source or text arguments"
        processed_text = file.Extract_text(source).process_text(text)
        sync = {source: processed_text}
        self.knowledge_json_file_map.concat(sync)
        return sync

    def sync_texts(self, texts_dic, save=False):
        synced = {}
        for source, text in texts_dic.items():
            sync = self.sync_text(source, text, save)
            if sync:
                synced = {**synced, **sync}
        return synced



class Data_manager(Base_data, Sync_knowleges):
    """docstring for Data_manager."""

    def __init__(self, id, is_db_file):
        super(Data_manager, self).__init__(id, is_db_file)
        self.user_disc_data = file.User_data(self.db_conn)
        self.knowledge_json_file_map = file.Knowledge_text_map(self.db_conn)
        self.knowledge_bytes_file_map = file.Knowledge_bytes_map(self.db_conn)
        #self.answers_json_file_map Not used
        self.answers_json_file_map = file.Knowledge_bytes_map(self.db_conn, "answers_data")
        Sync_knowleges.__init__(self, self.knowledge_json_file_map, self.knowledge_files_path)
        self.access_time = time.time()

    def data_save_first(self):
        current_time = time.time()
        return {"user_id": self.id, "start_time": self.access_time, "access_time": self.access_time, "end_time": current_time}

    def data_save_repeat(self):
        current_time = time.time()
        return {"access_time": self.access_time, "end_time": current_time}




    def save_text_knowledges(self, overide=False):
        self.knowledge_json_file_map.save(overide)

    def save_knowledges_bytes(self, overide=False):
        self.knowledge_bytes_file_map.save(overide)

    def save_user_data(self, overide=False):
        if self.user_disc_data.get_length() == 0:
            user_data = self.data_save_first()
            self.user_disc_data.overide_map(user_data)
            self.user_disc_data.save(False)
        else:
            user_data = self.data_save_repeat()
            self.user_disc_data.overide_map(user_data)
            self.user_disc_data.save(True)

    def save_all(self):
        self.save_text_knowledges()
        self.save_knowledges_bytes()
        self.save_user_data()

    def finish_off(self):
        self.save_all()
        self.close_db()
        self.remove_old_files()
