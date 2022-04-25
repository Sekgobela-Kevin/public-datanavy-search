# public-datanavy-search
> public version of datanavy search
## Description
public-datanavy-search is public repository version of private [Datanavy search](https://www.datanavy.site). 
All code and files come from datanavy search, they were just copied and then modified a bit to fix small 
errors. Datanavy search was once hosted in https://www.datanavy.site on pythonanywhere but was shutdown. 
Its used for reference for [Pynavy search](https://github.com/Sekgobela-Kevin/pynavy) which aims to 
improve and get rid of its bottlenecks.  

This repository is just for showing off datanavy search to help in developing both 
[Pynavy search](https://github.com/Sekgobela-Kevin/pynavy) and 
[Cnavy search](https://github.com/Sekgobela-Kevin/cynavy) projects which 
aim to be supersets of datanavy search. This repository code is so confusing, undocumented and 
uncommented making it harder to understand. Even myself find it harder to understand or change certain 
parts as it affect other parts.  

Datanavy search wasnt meant to be reused or maintained in long run. It was meant for learning about Python and 
experimenting with programming technologies. It was all about building an application that could perform a task other
than having to maintain and continually test it. It would be a waste of time and brain resources to try to 
maintain code in this repository. Even the private repository is never even maintained for such reasons, thats 
why Cnavy and Pynavy repositories were created.  

There are more disadvantages than even advantages when it comes to code in the repository. It runs but its 
not guaranteed especially code in client side. It was working when checked but sometimes webpage couldnt be loaded
fully. It failed to work on Edge browser but babel transpiled version it was working. I tried my best to maintain 
datanavy search for months but I realised that the time spent on it can be used for learning new thing. 
Thats why Cnavy was created to try to learn C\C++ languages and whats happening behind high level languages.  

Datanavy search has reached its goals and for me there is no need to maintain it further. The features it has were
the ones I wanted it to have and runs at speed that I expected even if my expectations have changed 
ever since. Datanavy search pushed me to learn what I couldnt have on my own including web development, NLP, AI and 
others that were not even integrated in the application.  
> its end of the road for datanavy search

## About Datanavy search
Datanavy search was intended for learning Python back in 2021.
It included both code for searching, crawling and displaying results in browser.
Crawling was done with requests, beutifulsoup, Pdfminer.six, pydocx and pypdf for supporting different formats.
Text proccessing was handled by NLTK and Spacy frameworks.
Search portion was using Numpy for working with indexes(numbers) generated from indexes of Spacy tokens.  

For server side, it was using Flask due its simplicity and Javascript, CSS and HTML for displaying data 
in browser. It was hosted in [datanavy.site](https://www.datanavy.site/) at 
[pythonanywhere.com](https://www.pythonanywhere.com/) until
being shutdown. It was challenging when creating the search engine especially client-side(browser) since I
had no knowledge of client-server programming including HTTP.  

It functioned as expected and its speed was on expectations based on how I wanted it to be. It used a lot 
hard-drive memory due to serialisation Spacy doc objects. It was fast but not fast as you would expect search
engine to be. Search code wasnt optimised and no indexes were saved for later use. Indexes needed to be created
everytime searching a document which was slowing down searching. Spacy was also slow when proccessing text
even if its powerful featuring AI.

Client side libraries for Datanavy search include W3.CSS, W3.JS, AngularJS and JQuery  
Server-side libraries included Spacy, NLTK, Numpy, Beautysoup, Pydocx, Pypptx, Pdfminer.six and Flask.

> Datanavy search repo is private.
  
> Pynavy search aims to improve datanavy search and public-datanavy-search recreates datanavy search.  

### public-datanavy-search search structure
All python files are in root durectory with static/ folder containing static data for Flask and templates/ folder
containing html templates to be worked by Flask. static/ and templates/ folders are required by Flask not 
defined by the datanavy search project.

I tried to use packages in folders but modules in packages couldnt be imported up until I decied to put all
files in project root directory so that they can easily import each other. I knew that would cause 
problems as project grows but I was eager to start coding in Python. My focus was on coding and trying out
Spider IDE than defining structure of the application.

Having a defined structure with subfolders and packages could have provided opportunity for modular programming
which could have improved code reuse and maintainace. Having everything in one place just caused problems regarding
what each file does which was breaking Single Responsibility Rule. Each python file(module) performs certain 
functionality but not always. Python side probles are too small compared Javascript side(browser) problems.

#### Python files
- **directories.py** -  for working with file system(creating files and dirs)
- **file.py** - has classes for representing a file(e.g database file) and classes for crawling for data. 
It has classes for working with PDF, DOCX, PPTX, Webpage and sqlite db file. It saves data into database and 
loads the data on  request using certain Classes. All classes are mixed up and can harder to understand.  

- **resources_manager.py** - manages resources for a user. Gives access to resources stored and manages them 
using file.py database access. Delete files that are no longer used, e.g extracted PDF files which are no 
longer neccessary as text is extracted.
- **users_resources.py** -  manages all users logged. Deletes inactive users resources which frees space.  

- **radial_search_local.py** - responsible for searching through  resources. Searching and ranking happens using
 Spacy doc objects from database.
- **radial_search.py** - first implementation for searching which failed leading to creating of 
radial_search_local.py.  

- **main.py** - combines everything together into user class to be used with Flask. User object represent a 
user which accepts user_id which gives access to database in file system. User_ids are used to name directory
with user resources includig database and uploaded files. users_resources.py collects user_ids from folder names
and uses it to manage the usesrs base don data inside the databases.  

- **flask_operations.py** - help simplify flask by providing simple methods. Used only for getting 
secure_filename of file. This is no longer relevant as text data is stored in database other than as .txt 
file. At momemt, it does not do anything special and than just call Flask.secure_filename() on each filename. 
Used only for compatibility and nothing else.
- **main_flask.py** - hosts our flask application to communicate with clients in browser. Session id get used 
as user_id which creates folders and databse file to store user resources. main_flask.py imports main to 
access User() object to initiate search or access data use resources. Most low-level stuffs get handled
by other modules included by main.py.   

- **users/** - contains resources for users including database files and uploaded files. This folder can increase
in size fast. Running users_resources.py can help free resources no longer used including user databases and 
files already extracted.

#### Client files
> files to be displayed or used by browser(.html, .css, .js)
- **static/** - folder contains static files to be loaded by client(broswer) e.g images, Javascript and CSS files.
- **templates/** - folder contains files to be worked on by Flask(Ginger template engine) before being sent to 
client(HTML files).  

Naming for files does not match what they are intended to do. Example, **questions_answers.html** in template 
folder which is loaded when visiting home url. When building datanavy search, I wanted to build application to 
help locate answers for online assessments fast than a human could. Thats why most of Classes and files have 
'**answer**' or '**question**' in their names but that was changed on rendered code and replaced with 
'**search results**' and '**search query**'. Underlying code wasnt changed due to maintainace and being unsure 
of new terms. Even **Datanavy search** wasnt called that way but something different like **Navigator**.

Datanavy search wasnt built as search engine but as just idea to help find answers inside books. After some
time I realised that all what I was thinking was search engine which resulted in renaming it to Datanavy search and 
buying [datanavy.site](https://www.datanavy.site/) domain for hosting the search engine. 
> did you realise that I just exposed myself?

## Usage
> ensure that you have python and git already installed also internet connection

1. open command-line application(bash, cmd, powershell , etc)
2. ```bash cd [dir]``` - move to directory to clone repository to, replace [dir] with directory.
3. ```bash git clone https://github.com/Sekgobela-Kevin/public-datanavy-search.git``` clones repository into 
current working directiry([dir]).  
4. ```bash pip install -r requirements.txt``` - to install dependecies e.g Spacy.
5. ```bash python main_flask.py``` - runs the application and after few seconds 'Running on http://127.0.0.1:5000' 
or similar will be printed.
6. copy http://127.0.0.1:5000 part into browser address bar as usual url.  
6. interact with webpage(upload resources and perform search)
> python or python3 depends on python version on your system or may use using virtual environment.  

> you are ready to perform search on files and urls.


## Support
Contact me on [kevinnoko23@gmail.com](mailto:kevinnoko23@gmail.com) if you spot an issue.  
Feedback regarding the repository or datanavy search will be appreaciated through email.  

## Contributing
This is ***ghost code*** that is not maintainable or readable making it harder to develop it any further.  
Contributions are welcome on [Cnavy search(C++)](https://github.com/Sekgobela-Kevin/cnavy) and 
[Pynavy search(C++)](https://github.com/Sekgobela-Kevin/cnavy) which are similar to Datanavy search

## Authors and acknowledgment
Project developed and maintained by [Sekgobela Kevin](https://github.com/Sekgobela-Kevin) from 
private repository Datanavy search.

## Project status
This project is not maintained, see above for reason.
> Checkout [Cnavy search](https://github.com/Sekgobela-Kevin/cnavy)(C++) and 
[Pynavy search](https://github.com/Sekgobela-Kevin/cnavy)(Python)

## License
[GPL-3.0 License](https://github.com/Sekgobela-Kevin/public-datanavy-search/blob/main/LICENSE)

