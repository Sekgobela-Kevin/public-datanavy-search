import os
import directories
from werkzeug.utils import secure_filename


class Files(object):
    """docstring for Files."""

    def __init__(self, request_obj, json_file_map, format_path_map=None, supported_formats=[".pdf",".docx",".pptx",".txt"]):
        super(Files, self).__init__()
        self.request_obj = request_obj
        self.json_file_map = json_file_map
        self.format_path_map = format_path_map
        self.supported_formats = supported_formats

    def get_original_filename(self, secure_filename):
        for file in self.get_files():
            if secure_filename(file.filename) == secure_filename:
                return file.filename

    def get_filesnames_map(self):
        '''safe filename(filesystem) : original filename(file.filename)'''
        filesnames_map = {}
        for file in self.get_files():
            filesnames_map[self.get_filename(file)] = self.get_filename(file, secure=False)
        return filesnames_map


    def is_format_supported(self, format):
        if self.format_path_map:
            return format in self.format_path_map
        else:
            return format in self.supported_formats

    def get_files(self):
        return self.request_obj.files.values()

    def get_filename(self, file_obj, secure=True):
        if secure:
            return secure_filename(file_obj.filename)
        else:
            return file_obj.filename

    def get_filenames(self, secure=True):
        filenames = []
        for file in self.get_files():
            if file:
                filenames.append(self.get_filename(file,  secure))
        return filenames

    def get_extension(self, filename):
        return directories.get_file_extension(filename)

    def get_format_path(self, format):
        assert self.format_path_map, "self.format_path_map is not None/map to False"
        if self.is_format_supported(format):
            return self.format_path_map[format]
        else:
            print("unsupported format encountered")

    def get_filepath(self, file_obj):
        filename = self.get_filename(file_obj)
        extension = self.get_extension(filename)
        if extension:
            return os.path.join(self.get_format_path(format), filename)
        else:
            print("filename couldnt be computed")


    def save(self, file_obj, path=None, optimize=True):
        #optimize would save the file if its not already extracted(synced)
        if optimize and self.json_file_map.is_key_avail(file_obj.filename):
            #already its synced
            return;
        assert path or self.format_path_map, "Path and format_path_map not provided"
        filename = self.get_filename(file_obj)
        extension = self.get_extension(filename)
        #if self.is_format_supported(extension):
        #    pass
        if path:
            filepath = os.path.join(path, filename)
        else:
            filepath = self.get_filepath(file_obj)
        if filepath:
            file_obj.save(filepath)
            return filepath
        #else:
        #    print("unsupported format encountered")

    def save_all(self, path=None, optimize=True, clean_first=True):
        #if clean_first:
        #    directories.delete_folder_contents(path)
        for file_obj in self.get_files():
            self.save(file_obj, path, optimize)
