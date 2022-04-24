# -*- coding: utf-8 -*-
"""
Created on Wed Jun 16 17:41:18 2021

@author: sekgobela kevin
"""

import spacy
#from spacy.tokens import Doc
from spacy.matcher import Matcher
from spacy_wordnet.wordnet_annotator import WordnetAnnotator
import numpy as np
import random


class Spacy_setup(object):
    """docstring for Spacy_setup."""

    def __init__(self):
        super(Spacy_setup, self).__init__()
        self.knowledges_nlp = None
        self.questions_nlp = None
        self.purpose_dict =  {"knowledges": self.knowledges_nlp, "questions": self.questions_nlp}

    def compute_nlp(self, purpose):
        if purpose == "knowledges":
            self.knowledges_nlp = spacy.load("en_core_web_sm", disable=["ner"])
            self.purpose_dict["knowledges"] = self.knowledges_nlp
            return self.knowledges_nlp
        elif purpose == "questions":
            self.questions_nlp = spacy.load("en_core_web_sm")
            self.add_wordnet_pipeline(self.questions_nlp)
            self.purpose_dict["questions"] = self.questions_nlp
            return self.questions_nlp


    def get_nlp(self, purpose):
        assert purpose in self.purpose_dict, "{purpose} purpose not found for loading spacy nlp onject"
        if self.purpose_dict[purpose]:
            return self.purpose_dict[purpose]
        else:
            return self.compute_nlp(purpose)

    def add_wordnet_pipeline(self, nlp_obj):
        nlp_obj.add_pipe("spacy_wordnet", after='tagger', config={'lang': nlp_obj.lang})


    def get_vocab(self, purpose):
        #nlp vocabulary not available after reload(use doc level vocabulary)
        #reload kills all object and recreates them again from db(flask requests)
        #no longer used for getting vocabulary(doc.vocab used instead)
        assert purpose in self.purpose_dict, "{purpose} purpose not found for loading spacy nlp vocab"
        assert self.purpose_dict[purpose], "nlp attribute is not yet set/initialised"
        return self.purpose_dict[purpose].vocab

spacy_setup_obj = Spacy_setup()



class Important_token(object):
    """docstring for Question. Perform operations on the knowledge text"""
    def __init__(self, token):
        self.token = token
        self.indexes = []
        #self.synonyms_doc = self.get_synonyms()
        #disbled as its not used

    def set_indexes(self, indexes):
        self.indexes = indexes

    def get_indexes(self):
        return self.indexes

    def get_token(self):
        return self.token

    def get_synonyms_doc(self):
        return self.synonyms_doc

    def get_synonyms(self):
        syno_words_tokens = []
        # We get those synsets within the desired domains
        synsets = self.token._.wordnet.synsets()
        if not synsets:
            syno_words_tokens.append(self.token.lemma_)
        else:
            lemmas_for_synset = set([lemma for s in synsets for lemma in s.lemma_names()])
            # If we found a synset in the economy domains
            # we get the variants and add them to the enriched sentence
            for lemma in lemmas_for_synset:
                syno_words_tokens.append(lemma)
        #doc = nlp(" ".join(syno_words_tokens))
        return syno_words_tokens

    def get_as_dict(self):
        token = self.get_token()
        return {"word": token.text, "pos": spacy.explain(token.pos_),
        "pos_context": spacy.explain(token.tag_),
        "is_stop": token.is_stop, "is_alpha": token.is_alpha,
        'synonyms': self.get_synonyms(), "entity_type": spacy.explain(token.ent_type_),
        "dependency_type": spacy.explain(token.dep_),
        }

class Data_init(object):
    """docstring for Data_init."""

    def __init__(self, source, text):
        self.text = text
        self.source = source
        self.important_tokens_pattern = [
            [{"POS": {"IN": ["VERB", "NOUN", "NUM", "ADJ", "ADV", "SYM", "PROPN", "INTJ"]},
         "IS_STOP": False}],
            [{"IS_DIGIT": True}],
            [{"LIKE_NUM": True}],
            [{"IS_ALPHA": False}]
        ]

    def get_text(self):
        return self.text

    def get_source(self):
        return self.source

    def get_doc(self):
        return self.doc

    def compute_important_tokens(self):
        '''get nouns,verbs from the question'''
        tokens = []
        matcher = Matcher(spacy_setup_obj.get_vocab(self.purpose))
        matcher.add("important_tokens", self.important_tokens_pattern)
        matches = matcher(self.doc)
        print(len(matches), "found", self.important_tokens_pattern)
        for match_id, start, end in matches:
            tokens.append(self.doc[start])
        return tokens


class Question(Data_init):
    """docstring for Question. Perform operations on the knowledge text"""
    def __init__(self, source, text):
        super(Question, self).__init__(source, text)
        self.words_limit = 30
        self.chars_limit = self.words_limit * 10 #prediction
        #cut the text from prediction(saves time)
        if len(self.text) > self.chars_limit:
            self.text = self.text[0:self.chars_limit]
        self.purpose = "questions"

        self.doc = spacy_setup_obj.get_nlp(self.purpose)(self.text)
        #cut doc to save search time
        if len(self.doc) > self.words_limit:
            self.doc = self.doc[0:self.words_limit]
        self.important_tokens = self.compute_important_tokens()
        self.important_tokens_objects = self.compute_important_tokens_objects()

    def text_modify(self, text):
        return text.lower()


    def get_important_tokens(self):
        return self.important_tokens

    def compute_important_tokens_objects(self):
        objs = []
        for token in self.important_tokens:
            objs.append(Important_token(token))
        return objs

    def get_important_tokens_objects(self):
        return self.important_tokens_objects

    def get_synonyms_tokens_groups(self):
        docs = []
        for important_tokens_object in self.get_important_tokens_objects():
            docs.append(important_tokens_object.get_synonyms_doc())
        return docs

    def get_as_dict(self):
        dict_data = [Important_token(token).get_as_dict() for token in self.doc]
        important_texts = [token.text for token in self.important_tokens]
        for data in dict_data:
            if data["word"] in important_texts:
                data["is_keyword"] = True
            else:
                data["is_keyword"] = False
        return [data for data in dict_data if data["pos"] != 'PUNCT']


class Finder(object):
    """docstring for Finder."""

    def __init__(self, doc):
         super(Finder, self).__init__()
         self.doc = doc
         '''self.important_tokens_pattern_knowledges = [
            [{"IS_STOP": False}],
            [{"IS_DIGIT": True}],
            [{"LIKE_NUM": True}],
            [{"IS_ALPHA": False}]
         ]
         self.important_indexes = self.get_important_indexes()'''

    '''def get_important_indexes(self):
        important_tokens = self.compute_important_tokens()
        indexes = [token.i for token in important_tokens]
        if indexes:
            return np.array(indexes, dtype='i')
        else:
            return indexes
    '''

    def indexes_to_tokens(self, doc, indexes):
        return [doc[index] for index in indexes]

    def match(self, pattern):
        matcher = Matcher(self.doc.vocab)
        matcher.add(random.randint(0,50000), pattern)
        return matcher(self.doc)


    def compute_default_search_pattern(self, tokens):
        #This pattern is weak as it dosn't match words within tokens, only token as whole
        #xhosa should also match isxhosa
        #Spacy regular expressions may be used for that task
        assert len(tokens) > 0, "search pattern cant be created without tokens"
        pattern = []
        for token in tokens:
            text = token.text
            computed_pattern = [
                [{"LEMMA": {"IN": [token.lemma_, text, text.lower(), text.upper(), text.capitalize(), text.title()]}}],
                [{"SHAPE": token.shape_, "IS_ALPHA": False, "IS_DIGIT": False}]
            ]
            for c_pattern in computed_pattern:
                pattern.append(c_pattern)
        return pattern

    '''def get_indexes(self, tokens):
        indexes = []
        for q_token in  tokens:
            for k_index in self.important_indexes:
                k_token = self.doc[k_index]
                lemma_same = q_token.lemma_ == k_token.lemma_
                if lemma_same:
                    indexes.append(k_token.i)
        return np.unique(indexes)
    '''

    def get_indexes(self, tokens):
        indexes = []
        tokens_pattern = self.compute_default_search_pattern(tokens)
        matches = self.match(tokens_pattern)
        for match_id, start, end in matches:
            indexes.append(self.doc[start].i)
        return np.unique(indexes)

    def get_indexes_groups(self, tokens_groups):
        indexes_groups = []
        for tokens_group in tokens_groups:
            indexes_groups.append(np.array(self.get_indexes(tokens_group), dtype='i'))
        return indexes_groups

    def get_indexes_groups_from_tokens(self, tokens):
        '''testing function(development)'''
        indexes_groups = []
        for token in tokens:
            indexes_groups.append(np.array(self.get_indexes([token]), dtype='i'))
        #Error expected(np.array(indexes_groups, dtype='i'))
        #ValueError: setting an array element with a sequence.
        #I predicted the error above and it was raised(I learnt 2021 June 11:21 Am)
        return indexes_groups



class Knowledge(Data_init, Finder):
    """docstring for Knowledge."""

    def __init__(self, source, text):
        super(Knowledge, self).__init__(source, text)
        self.purpose = "knowledges"
        self.text_limit = 800000
        #greater than million may cause memory allocation errors(spacy side)
        if len(self.text) > self.text_limit:
            self.text = self.text[:self.text_limit]
        self.doc = spacy_setup_obj.get_nlp(self.purpose)(self.text)

        Finder.__init__(self, self.doc)

    def set_doc(self, doc_cont):
        '''testing(developmental)'''
        self.doc = doc_cont

    def get_indexes_obj(self, important_tokens):
        indexes_groups = self.get_indexes_groups_from_tokens(important_tokens)
        return Indexes(indexes_groups)



class Knowledges(object):
    """docstring for knoweleges. Manages knowledges objects. Sync wiith databse is done manually."""

    def __init__(self, knowledge_json_file_map, knowledge_bytes_file_map, sources=None):
        super(Knowledges, self).__init__(444)
        self.knowledge_json_file_map = knowledge_json_file_map
        self.knowledge_bytes_file_map = knowledge_bytes_file_map
        self.sources = sources
        #loads objects from bytes
        self.knowledges_objects_dict = {}

    def sync_with_maps(self, elements):
        assert type(elements) == type([]), f"list expected but got {type(elements)}"
        self.knowledge_json_file_map.db_sync(elements)
        self.knowledge_bytes_file_map.db_sync(elements)



    def is_source_valid(self, source):
        in_json_map = self.knowledge_json_file_map.is_key_avail(source)
        in_knowledges_obj = self.knowledge_bytes_file_map.is_key_avail(source)
        return in_json_map or in_knowledges_obj

    def filter_sources_by_validity(self, sources):
        filtered = [source for source in sources if self.is_source_valid(source)]
        return list(set(filtered))

    def create_knowledge_obj(self, source, text):
        return Knowledge(source, text)

    def get_knowledge_obj(self, source):
        assert self.knowledge_bytes_file_map.is_key_avail(source), f"attempt to access knowledge with '{source}' as source that doesnt exist in computed knowledges"
        return self.knowledge_bytes_file_map.get_value(source)

    def add_knowledge(self, knowledge_obj):
        source = knowledge_obj.get_source()
        self.knowledge_bytes_file_map.append(source, knowledge_obj)

    def sync_source(self, source):
        assert self.is_source_valid(source), f"knowledge with \
         '{source}' as source does not exist"
        if self.knowledge_bytes_file_map.is_key_avail(source):
            return self.knowledge_bytes_file_map.get_value(source)
        else:
            text =  self.knowledge_json_file_map.get_value(source)
            knowledge_obj = self.create_knowledge_obj(source, text)
            self.add_knowledge(knowledge_obj)
            #Data sometimes is not available I guess sometimes
            #Seems to be caused by threads provided with flask when using website
            #Similar problems have been observed, using side effects on methods and funtion should be avoided
            #Methods should only modify local variables not those outside(side effect)
            #Rather they return computed values
        return knowledge_obj

    def sync_sources(self, sources):
        #items are stored but just retured for incase
        synced_knowledges = []
        for source in sources:
            if self.is_source_valid(source):
                sync = self.sync_source(source)
                synced_knowledges.append(sync)
        return synced_knowledges

    def get_knowledges_objs(self, sources):
        #sync to retrieve data from database
        self.sync_with_maps(sources)
        self.sync_sources(sources)
        #filterd sources are used for generating searched knowledges
        filtered_sources = self.filter_sources_by_validity(sources)
        knowledges_objs = [self.get_knowledge_obj(source) for source in filtered_sources]
        #development code(testing)
        #Now required for flask(no longer developmetal)
        self.knowledge_bytes_file_map.concat(self.knowledges_objects_dict)
        self.knowledge_bytes_file_map.save()
        return knowledges_objs




class Indexes_data(object):
    """docstring for Indexes_data."""

    def __init__(self, grouped_indexes):
        super(Indexes_data, self).__init__()
        self.grouped_indexes = grouped_indexes
        self.match_limit = 0.60#50%
        self.max_distance_limit = 100
        self.answers_prob_limit = 0.5

    def get_grouped_indexes(self):
        return self.grouped_indexes






class Rank(Indexes_data):
    """docstring for Rank. Ranks results from search, also indexes"""

    def __init__(self, grouped_indexes):
        super(Rank, self).__init__(grouped_indexes)

        #contribution of each facter on ranking
        self.closeness_contr = 0.6
        self.keywords_match_contr = 0.4

    def get_indexes_diff_average(self,indexes):
        #indexes need to be sorted to get corect results
        #We never work on indexes that are empty
        #Copied from Indexes(Indexes inherit this class)
        assert len(indexes) != 0, "indexes cant be empty"
        if len(indexes) == 1:
            return 1
        diff = np.diff(indexes)
        #np.sum(diff) sum shows warning
        return  np.sum(diff)/len(diff)


    def get_indexes_closeness(self, indexes, max_limit):
        assert max_limit, "zero limit not allowed"
        assert len(indexes), "empty indexes not allowed"
        if len(indexes) == 1:
            #index length of one are given 100% but will lose on keywords match ratio
            return 1
        diff_average = self.get_indexes_diff_average(indexes)
        diff_average_inverse = abs(diff_average - max_limit)
        #Maximum is 0.99(bug), but its great proving the search is not 100%
        return diff_average_inverse/max_limit

    def indexes_keywords_match_ratio(self, indexes, total_keywords,  one_keyword_ref=10):
        #one_keyword_ref is used for approximation when total keywords is 1
        #one_keyword_ref of 20 will make it harder for 1 keyword to reach 100%
        #Theres no way to know if its an answer if 1 keyword matched
        assert len(indexes), "Method is not meant for indexes of length 0. You can manually conclude that they have keywords_match_ratio of 0"
        if total_keywords == 1:
            ratio = len(indexes)/one_keyword_ref
            if ratio < 0.5:
                return 0.5
            elif ratio > 1:
                return  1
            else:
                return ratio
        else:
            return len(indexes)/total_keywords
        assert False, "Something went wrong(impossible)"


    def get_rank_ratio(self, indexes):
        keywords_match_ratio = self.indexes_keywords_match_ratio(indexes, len(self.grouped_indexes))
        closeness_ratio = self.get_indexes_closeness(indexes, self.max_distance_limit)
        match_ratio_final = keywords_match_ratio * self.keywords_match_contr
        closeness_ratio_final = closeness_ratio * self.closeness_contr
        return match_ratio_final + closeness_ratio_final



class Indexes(Rank):
    """docstring for Indexes."""

    def __init__(self, grouped_indexes):
        super(Indexes, self).__init__(grouped_indexes)


    def get_closest_index(self, value, indexes,):
        "tested"
        indexes = np.array(indexes, dtype='i')
        absolute_val_array = np.abs(indexes - value)
        smallest_difference_index = absolute_val_array.argmin()
        closest_element = indexes[smallest_difference_index]
        return int(closest_element)


    def get_closest_values(self, value, values, max_limit):
        #Beware of int in the np array
        if not len(values):
            return []
        else:
            array = np.array(values, dtype='i')
            filter_arr = np.absolute(array - value) <= max_limit
            return array[filter_arr]



    def get_closest_indexes(self, index, grouped_indexes=None):
        '''can be slow if grouped indexes large(opinion) June'''
        if grouped_indexes == None:
            grouped_indexes = self.grouped_indexes
        closest_indexes = []
        if len(grouped_indexes) == 1:
            #Trick to accomodate length of 1
            #The trick looks great and can be used to improve presition
            #Can help in rating a keyword based on its own indexes(just think)
            #Copared to other that perform at group leve, it perform at keyword level
            array = grouped_indexes[0]
            filter_arr = array != index
            return self.get_closest_values(index, array[filter_arr], self.max_distance_limit)

        for indexes in grouped_indexes:
            #The index on its own will be included in closest_indexes
            #If thats not neccesary than set condition in next statement
            if len(indexes) > 0 and index not in indexes:
                closest = self.get_closest_index(index, indexes)
                if abs(closest - index) <= self.max_distance_limit:
                    closest_indexes.append(closest)
        return list(set(closest_indexes))

    def index_part_of_answer_prob(self, index, grouped_indexes=None):
        if grouped_indexes == None:
            grouped_indexes = self.grouped_indexes
        grouped_index_length = len(grouped_indexes)
        # The conditions are there to force answer, should be removed in future
        if grouped_index_length == 0:
            return 0

        #Waste of resources if the indexes will be recalculated by another function
        #Used dict to optimise(reuse of data)
        indexes_group = list(self.get_closest_indexes(index, grouped_indexes)) + [index]

        #Length of 1 causes an error during ranking(just incase)
        if not len(indexes_group):
            return 0
        prob = self.get_rank_ratio(indexes_group)
        return {"indexes": indexes_group, "prob": prob}


    def is_index_part_of_answer(self, index):
        #waste of computer resources(prob is lost)
        prob_dict = self.index_part_of_answer_prob(index)
        is_part = prob_dict["prob"] >= self.answers_prob_limit
        if len(self.grouped_indexes) == 1:
            is_part = True
        return  {**{"is_part": is_part}, **prob_dict}

    def convert_to_list(self,indexes):
        return indexes.tolist()

    def get_min_abs_distances(self, indexes1, indexes2):
        "tested"
        C = np.sort(indexes2)
        a = C.searchsorted(indexes1)
        right = np.minimum(a, len(C) - 1)
        left  = np.maximum(a - 1, 0)
        right_diff = indexes1- C[right]
        left_diff  = indexes1 - C[left ]
        return np.where(np.abs(right_diff) <= left_diff, right_diff, left_diff)

    def get_min_abs_distance_pairs(self, indexes1, indexes2):
        "tested"
        indexes1 = np.array(indexes1, dtype='i')
        indexes2 = np.array(indexes2, dtype='i')
        dist = np.abs(indexes1[:,None]-indexes2)
        idx = np.where(dist==dist.min())
        return np.stack((indexes1[idx[0]], indexes2[idx[1]]), dtype='i')


    def get_most_promising_indexes(self, include_prob=False):
        promising_indexes = []#[index, prob]
        for indexes in self.grouped_indexes:
            if len(indexes) > 0:
                for index in indexes:
                    #waste of resources
                    part_dict = self.is_index_part_of_answer(index)
                    if part_dict["is_part"]:
                        if include_prob:
                            item = {"index":int(index), "indexes":part_dict["indexes"], "prob":part_dict["prob"]}
                        else:
                            item = int(index)
                        promising_indexes.append(item)
        if len(promising_indexes):
            if not include_prob:
                return np.sort(promising_indexes)
            else:
                #sort indexes by prob to increase precition when grouping(filtering)
                #filtering involves removing indexes that are part of same answer
                prob_sorted = sorted(promising_indexes, key=lambda x: x["prob"])
                prob_sorted.reverse()
                return prob_sorted
        else:
            return []


    def get_boundary_indexes(self, indexes):
        length = len(indexes)
        assert length > 0, "empty indexes not allowed"
        if length == 1:
            return indexes[0]
        else:
            return [min(indexes), max(indexes)]

    def indexes_part_of_same_answer(self,index1, index2, strict=False, arrays=False):
        #If array is True then index1 and index2 will be viewed as lists containing closest indexes
        #This is done incase closest indexes are already computed to improve performance
        if arrays:
            index1_group = index1
            index2_group = index2
        else:
            index1_group = self.get_closest_indexes(index1) + [index1]
            index2_group = self.get_closest_indexes(index2) + [index2]

        if strict:
            for index in index1_group:
                if index in index2_group:
                    return True
            return False
        else:
            return  self.get_boundary_indexes(index1_group) == self.get_boundary_indexes(index2_group)

    def array_indexes_part_of_same_answer(self,indexes1, indexes2, strict=False, arrays=False):
        #indexes
        #optimisation when arrays == False
        if arrays:
            index1_group = indexes1
            index2_group = indexes2
        else:
            index1_group = self.get_closest_indexes(indexes1) + [indexes1]
            index2_group = []
            for index in indexes2:
                index2_group.append(self.get_closest_indexes(indexes2) + [indexes2])

        for indexes_ in index2_group:
            if self.indexes_part_of_same_answer(index1_group, indexes_, strict=strict, arrays=True):
                return True
        return False


    def index_already_covered(self, index, covered_indexes, array=False):
        #array arguments specify if indexes is list(false mean is an integer)
        if array:
            return set(index) & set(covered_indexes)
        else:
            return index in covered_indexes


    def filter_indexes_by_min_diff(self, indexes, min_limit, break_limit=None):
        #indexes may still overlap with their closest indexes
        #This function is independent, it doesnt have access to closest indexes
        #Trik thought 15:48 2021 June 04, that would allow filtering without access to closest indexes(performance boot)
        #old: abs(filtered[-1] - index) > min_limit
        #New: abs(filtered[-1] + min_limit) > index - min_limit(discovered the pattern on paper)
        #Great method and algorithm, but doesnt work due to thecurrent implementation. If used, other methods may generate unpredictable results
        #I have found that neuro theory to exist in the indexes(may can help in future)

        assert len(indexes), "Empty indexes no allowed, Atleast 1 element."
        filtered = [indexes[0]]
        for index in indexes[1:]:
            if  abs(filtered[-1]  + min_limit) < abs(index - min_limit):
                filtered.append(index)

        return filtered





    def get_grouped_indexes_by_distance(self, grouped_promising_indexes):
        "optimised"
        #keeps track of indexes
        #Higher answers_prob indexes may get ignored(50% %0% chance)
        #Solution may be sorting indexes by index_part_of_answer_prob(descending)
        #That would result in high prob indexes considered first looping
        #Note: we lost reference to useful data like(prob)(they will be recalculated)
        indexes_groups = []
        covered_indexes = set()
        for indexes_group in grouped_promising_indexes:
            if len(indexes_group) != 0 and len(list(covered_indexes & set(indexes_group))) == 0:
                indexes_groups.append(sorted(indexes_group))
                covered_indexes.update(indexes_group)
        flat_indexes = [item for sublist in indexes_groups for item in sublist]
        assert len(flat_indexes) == len(list(set(flat_indexes))), "indexes_groups may be containing duplicates indexes within its grouped indexes or they may be sharing indexes"
        return indexes_groups


    def get_promising_indexes_groups(self):
        #Method should use arguments(causes problems with optimisation)
        promising_indexes = self.get_most_promising_indexes(include_prob=True)
        filtered = self.get_grouped_indexes_by_distance([indexes_data["indexes"] for indexes_data in promising_indexes])
        return filtered


    def get_most_promising_index(self):
        max_prob = 0
        max_index = None
        for indexes in self.grouped_indexes:
            for index in indexes:
                prob = self.index_part_of_answer_prob(index)["prob"]
                if prob >= max_prob:
                    max_prob = prob
                    max_index = index
        if max_index == None:
            return None
        return [max_index, max_prob]

    def is_answer_avail(self):
        #reuse the data to avod recalculating
        promising_groups = self.get_promising_indexes_groups()
        if len(promising_groups):
            return {"promising_groups": promising_groups}
        else:
            return False


    def indexes_neuro_link_average(self, indexes):
        '''Finds average of probility of indexes being part of answer.
        Called neuro as this functions like neurons in nature'''
        '''It consumes computer resources(not tested) due to calculating probability for every index(indexes_group can be large(thousands or millions))'''
        assert len(indexes), "indexes seems to be empty"
        indexes_probs = []
        for index in indexes:
            indexes_probs.append(self.index_part_of_answer_prob(index)["prob"])
        return sum(indexes_probs)/len(indexes_probs)






class Stored_answers(object):
    """docstring for Stored_answers. stores answers/results from user for future uses(eg recommendations and optimisations). If used well can be an advantage into improving the search. Currently it uses question/query as key which is problem but saves space"""

    def __init__(self, answers_json_file_map):
        super(Stored_answers, self).__init__()
        self.answers_json_file_map = answers_json_file_map

    def get_answers(self):
        return self.answers_json_file_map.get_map()

    def get_questions(self):
        return self.answers_json_file_map.get_keys()

    def add_answer(self, question, results):
        self.answers_json_file_map.append(question, results)

    def question_avail(self, question):
        return self.answers_json_file_map.is_key_avail(question)

    def question_sources_avail(self, question, knowledge_sources):
        '''Test if question with certain sources exists'''
        if self.question_avail(question):
            searched = self.answers_json_file_map.get_value(question)["searched_knowledges"]
            if set(searched).issuperset(set(knowledge_sources)):
                return True
        return False

    def concat(self, map_like):
        self.answers_json_file_map.concat(map_like)

    def save(self):
        self.answers_json_file_map.save()


class Search_base(Knowledges, Stored_answers):
    """docstring for Search_base."""

    def __init__(self, knowledge_json_file_map, knowledge_bytes_file_map, answers_json_file_map):
        super(Search_base, self).__init__(knowledge_json_file_map, knowledge_bytes_file_map)
        Stored_answers.__init__(self, answers_json_file_map)


    def get_question_obj(self, source, text):
        return Question(source, text)

    def get_questions_objs(self, source, questions):
        #in future questions should have sources
        return [self.get_question_obj("__unknown__", question) for question in questions]


    def get_promising_knowledges_data(self, question, knowledge_sources):
        '''[{knowledge_obj:.., indexes_obj:.., question_obj:..}]'''

        promising_data = []
        question_obj = self.get_question_obj("__unknown__", question)
        important_tokens = question_obj.get_important_tokens()
        for knowledge in self.get_knowledges_objs(knowledge_sources):
            indexes_obj = knowledge.get_indexes_obj(important_tokens)
            is_avail = indexes_obj.is_answer_avail()
            if is_avail:
                data = {**{"knowledge_obj":knowledge, "question_obj": question_obj , "indexes_obj":indexes_obj}, **is_avail}
                promising_data.append(data)
        return promising_data

    def get_knowledges_promising_indexes(self,  knowledges_data):
        #We lose access to indexes_obj
        '''Returns knowledge promising indexes that are not ranked'''
        "[{knowledge_obj:.., indexes:.., indexes_obj:..., relevance:..}, ...]"
        knowledges_promising_indexes = []
        for knowledge_data in knowledges_data:
            indexes_obj = knowledge_data["indexes_obj"]
            promising_indexes_groups =  indexes_obj.get_promising_indexes_groups()
            #Take note of the rank object
            rank_obj = Rank(indexes_obj.get_grouped_indexes())
            for indexes in promising_indexes_groups:
                if len(indexes) == 0:
                    #hope the loop will continue(goto next element __next__())
                    continue
                relevance = rank_obj.get_rank_ratio(indexes)
                promising_data = {"indexes":indexes, "relevance":relevance, "knowledge_obj": knowledge_data["knowledge_obj"], "question_obj": knowledge_data["question_obj"]}
                knowledges_promising_indexes.append(promising_data)
        return knowledges_promising_indexes



    def get_question_results(self, question, knowledge_sources):
        #The name promising_indexes collides with those used in indexes
        knowledges_data = self.get_promising_knowledges_data(question, knowledge_sources)
        Knowledges_indexes = self.get_knowledges_promising_indexes( knowledges_data)
        #Ranking can happen here while having access to data
        #self.remove_from_allowed_questions(question_obj.get_text())
        #This line of code saved me from stress: 2021 June 04 20:21
        sorted_indexes = sorted(Knowledges_indexes, key=lambda x: (x["relevance"]))
        sorted_indexes.reverse()
        #clear allowed knoweleges
        return sorted_indexes

    def get_results(self, questions, knowledges_sources):
        '''[{question_obj:.., "question_results":..}, ...]'''
        questions_objs = self.get_questions_objs(set(questions))
        results = []
        for question_obj in questions_objs:
            question_results = self.get_question_results(question_obj)
            results.append({"question_obj":question_obj, "question_results":question_results})
        return results



class Answer(object):
    """docstring for Answer. Converts question results into datastruture compatible with json and other data strutures that are cross platform like list/maps(compatible with json)"""

    def __init__(self, question_results, question_text, searched_knowledges_sources, text_output=False):
        super(Answer, self).__init__()
        self.question_text = question_text
        self.question_results = question_results
        self.searched_knowledges_sources = searched_knowledges_sources
        self.text_output = text_output

    def get_indexes_span_full(self, indexes, knowledge_obj):
        length = len(indexes)
        if length == 1:
            #remember sent is a span in spacy
            return knowledge_obj.doc[indexes[0]].sent
        elif  length > 1:
            start_sent = knowledge_obj.doc[indexes[0]].sent
            end_sent = knowledge_obj.doc[indexes[-1]].sent
            return knowledge_obj.doc[start_sent.start:end_sent.end]
        else:
            return None


    def get_indexes_span(self, indexes, knowledge_obj):
        length = len(indexes)
        if length == 1:
            return knowledge_obj.doc[indexes[0]:indexes[0]+1]
        elif  length > 1:
            return knowledge_obj.doc[indexes[0]:indexes[-1]+1]
        else:
            return None


    def get_span_start_end_indexes(self, span):
        return [span.start_char, span.end_char]

    def get_token_start_end_indexes(self, token):
        return [token.idx, token.idx + len(token.text)]

    def tokens_indexes_to_real(self, indexes, doc):
        real_indexes = []
        for index in indexes:
            token = doc[index]
            real_indexes.append(self.get_token_start_end_indexes(token))
        return real_indexes

    def is_found(self):
        return len(self.question_results) != 0


    def get_output(self, indexes, knowledge_obj, full=True):
        """indexes are in float64 and dont know why"""
        if full:
            span = self.get_indexes_span_full(indexes, knowledge_obj)
        else:
            span = self.get_indexes_span(indexes, knowledge_obj)

        if self.text_output:
            output = span.text
        else:
            output = self.get_span_start_end_indexes(span)
        return output


    def get_words(self, indexes, doc):
        words = []
        #assert max(indexes) >= len(doc), "Max index out of range in doc object"
        for index in indexes:
            words.append(doc[index])
        return words

    def token_indexes_to_real(self, indexes, doc):
        pass


    def get_keywords(self, indexes, doc):
        if self.text_output:
            output = self.get_words(indexes, doc)
        else:
            output = self.tokens_indexes_to_real(indexes, doc)
        return output


    def get_recommends(self, question_results):
        '''[{knowledge_source:.., output:..,output_full:.., keywords:[], validity:%}]'''
        recommends = []
        for promising_indexes in question_results:
            knowledge_obj = promising_indexes["knowledge_obj"]
            #Convert indexes back to numpy integer as errors are raised regarding integers when using the indexes
            indexes = np.array(promising_indexes["indexes"], dtype='i')
            relevance = promising_indexes["relevance"]

            recommend = {"knowledge_source":knowledge_obj.get_source(),   "output":self.get_output(indexes, knowledge_obj, full=False), "output_full":self.get_output(indexes, knowledge_obj), "keywords":self.get_keywords(indexes, knowledge_obj.get_doc()),
            "relevance":relevance}
            recommends.append(recommend)
        return recommends


    def get_max_vality(self, recommends):
        max_relevance = 0
        for recommend in recommends:
            if recommend["relevance"] > max_relevance:
                max_relevance = recommend["relevance"]
        return max_relevance

    def get_results(self):
        recommends = self.get_recommends(self.question_results)
        #waste resources
        max_relevance = self.get_max_vality(recommends)
        results = {self.question_text:{ "found":self.is_found(), "recommends":recommends, "relevance":max_relevance, "searched_knowledges":self.searched_knowledges_sources}}
        return results


class Answers(Search_base):
    """docstring for Answers."""

    def __init__(self, knowledges_map, knowledge_bytes_file_map, answers_map):
        super(Answers, self).__init__(knowledges_map, knowledge_bytes_file_map, answers_map)


    def get_answer_obj(self, question_text, knowledges_sources, text_output):
        question_results =  self.get_question_results(question_text, knowledges_sources)
        #filtered sources are not searched
        searched_knowledges = self.filter_sources_by_validity( knowledges_sources)
        return Answer(question_results, question_text, searched_knowledges, text_output)

    def get_answer_results(self, question, searched_knowledges_sources, text_output=False):
        answer_obj = self.get_answer_obj(question, searched_knowledges_sources, text_output)
        #put code to load results from answers.json if it exists(.is_answered())
        if answer_obj.is_found():
            pass
        return answer_obj.get_results()

    def get_answers_results(self, questions_queries, text_output=False, save=True):
        '''questions_quesries=[
         {text:.., source:.., "knowledges_sources":[..,..]},
        ]
        '''
        assert questions_queries != 0, 'questions_queries is empty'
        answers_results = {}
        for querie in questions_queries:
            answer_results = self.get_answer_results(querie["text"], querie["knowledges_sources"], text_output)
            #if answer_results != None:
            #adding elements to dictionary by re-assigning the dictionary
            answers_results = {**answers_results, **answer_results};
        #Final result ready to be sent to web GUI(needs interpretation)
        #if save:
            #beaware of this methods names which may be overiden
        #    self.concat(answers_results)
        #    self.save()
        return answers_results




if __name__ == "__main__":
    source = "custom text"
    ktext = '''Skip to content
This website uses cookies to improve the user experience. By using this website you consent to all cookies in accordance with our cookie policy.


From 1964 to 1982 he was confined to the notorious prison island Robben Island, together with several other resistance leaders. He was then moved to prison on the mainland until his release in 1990. During his imprisonment, Mandela became a rallying point for South Africa's oppressed, and the world's most famous political prisoner.

Nelson Mandela shared the Peace Prize with the man who had released him, President Frederik Willem de Klerk, because they had agreed on a peaceful transition to majority rule.

Copyright © The Norwegian Nobel Institute
To cite this section
MLA style: Nelson Mandela – Facts. NobelPrize.org. Nobel Prize Outreach AB 2021. Thu. 1 Jul 2021. <https://www.nobelprize.org/prizes/peace/1993/mandela/facts/>

Back to top
About the Nobel Prize organisation
The Nobel Foundation
Tasked with a mission to manage Alfred Nobel's fortune and has ultimate responsibility for fulfilling the intentions of Nobel's will.

The prize-awarding institutions
For more than a century, these academic institutions have worked independently to select Nobel Laureates in each prize category.

Nobel Prize outreach activities
Several outreach organisations and activities have been developed to inspire generations and disseminate knowledge about the Nobel Prize.

Press
Contact
FAQ
Privacy policy
Technical support
Terms of use
For developers
Media player
Join us
Facebook Twitter Instagram Youtube LinkedIn
THE NOBEL PRIZE
Copyright © Nobel Prize Outreach AB 2021'''
    qtext ='''nelson nobel Prize win
      '''


    knowledge_obj = Knowledge(source, ktext)
    question_obj = Question("question source", qtext)
    indexes_obj = knowledge_obj.get_indexes_obj(question_obj.get_important_tokens())
    print(indexes_obj.get_most_promising_indexes(include_prob=True))
    print(indexes_obj.get_most_promising_index())
    print(indexes_obj.index_part_of_answer_prob(293))
    print(indexes_obj.indexes_part_of_same_answer(93,40, strict=True))
    print(indexes_obj.array_indexes_part_of_same_answer([93],[[95, 40, 93]], arrays=True, strict=True))
    print(indexes_obj.get_indexes_diff_average([100]))
    print(indexes_obj.filter_indexes_by_min_diff(indexes_obj.get_most_promising_indexes(include_prob=False), 100))


    promising_indexes = indexes_obj.get_most_promising_indexes(include_prob=True)
    grouped_indexes = [indexes_data["indexes"] for indexes_data in promising_indexes]
    print(grouped_indexes)
    print(indexes_obj.get_grouped_indexes_by_distance(grouped_indexes))


    print(indexes_obj.get_closest_indexes(185))
    print(indexes_obj.indexes_neuro_link_average([293, 2532]))
    print(Rank(3).get_indexes_closeness([1,2,3,4], 100))
    print(Rank(33).indexes_keywords_match_ratio([3,6,3,6],4))
    print(Rank([2,3,5,3]).get_rank_ratio([1,2,3,4]))
    print(question_obj.get_important_tokens())

    print(knowledge_obj.doc[175].sent)






    pass
