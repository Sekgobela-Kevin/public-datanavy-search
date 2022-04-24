'''Manages files and folders within the application. It also provide
directory information about files. It deletes, move, copy and create
folder and files.'''


import os
import re
import glob
import shutil
from os.path import normpath, basename


def cwd():
    return os.getcwd()

def is_dir(path):
    return os.path.isdir(path)

def create_dir(path):
    if not is_dir(path):
        os.mkdir(path)


def delete_dir(path):
    if is_dir(path):
        try:
            shutil.rmtree(path)
            return True
        except PermissionError:
            return False

def rename_dir(old, new):
    assert is_dir(old), f"{old} is not valid directory"
    os.rename(old, new)

def is_file_empty(path):
    return os.path.getsize(path) == 0

def is_file(path):
    return os.path.isfile(path)

def create_file(path):
    file = open(path, 'w', encoding='utf-8')
    file.close()


def write_file(file_path, content):
    file = open(file_path, "w", encoding='utf-8')
    file.write(content)
    file.close()


def append_file(file_path, content):
    file = open(file_path, "a", encoding='utf-8')
    file.write(content)
    file.close()

def remove_file(path):
    try:
        os.remove(path)
        return True
    except PermissionError:
        return False
    except FileNotFoundError:
        return False

def file_read(file_path):
    file = open(file_path, "r", encoding='utf8')
    content = file.read()
    file.close()
    return content


def get_filename_extension(path):
    name = os.path.basename(path)
    return name


def get_file_extension(path):
    base = get_filename_extension(path)
    return os.path.splitext(base)[1]


def get_filename(path):
    base = get_filename_extension(path)
    return os.path.splitext(base)[0]



def files_paths(folder_path, format_=None):
    #file within function name is misleading
    files_paths = []
    if format_!=None:
        folder_path = os.path.join(folder_path,"*."+format_)
    else:
        folder_path = os.path.join(folder_path,"*")
    for file in glob.glob(folder_path):
        files_paths.append(file)
    return files_paths


def get_folders(folder_path):
    assert is_dir(folder_path), f"'{folder_path}' is not a directory/folder"
    return [path for path in files_paths(folder_path) if is_dir(path)]

def delete_folder_contents(folder_path):
    folder_files_paths = files_paths(folder_path)
    for file_path in folder_files_paths:
        remove_file(file_path)
        delete_dir(file_path)#remove folders also



def get_valid_filename(s):
    s = str(s).strip()
    return re.sub(r'(?u)[^-\w.]', ' ', s)

def get_folder_name(path):
    return basename(normpath(path))

if __name__ == "__main__":
    #114 users
    path = r"/users"
    print(len(get_folders(path)))
