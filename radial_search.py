'''Development stopped in 2021 June 16 17:26'''

import spacy
from spacy.tokens import Doc
from spacy.matcher import Matcher
from spacy_wordnet.wordnet_annotator import WordnetAnnotator
import numpy as np
import resources_manager

nlp = spacy.load("en_core_web_sm")
nlp.add_pipe("spacy_wordnet", after='tagger', config={'lang': nlp.lang})


class Processing(object):
    """docstring for Question."""

    def __init__(self, source, text):
        super(Processing, self).__init__()
        self.text = text
        self.source = source
        self.important_words_pattern = [{"POS": {"IN": ["VERB", "NOUN", "NUM", "ADJ"]}}]
        self.search_attr = ["LEMMA"]
        self.words_limit = 100 #half total words in paragraph
        self.doc = nlp(self.text)

    def init_text(self, text):
        return text

    def get_source(self):
        return self.source

    def get_text(self):
        return self.text_path

    def get_doc(self):
        self.doc

    def get_words_limit(self):
        return self.words_limit

    def set__words_limit(self, value):
        self.words_limit = value

    def get_important_words_tokens(self):
        '''get nouns from the question'''
        spans = []
        matcher = Matcher(nlp.vocab)
        matcher.add("important_words", [self.important_words_pattern])
        print([self.important_words_pattern])
        matches = matcher(self.doc)
        print(len(matches),"matched words")
        for match_id, start, end in matches:
            spans.append(self.doc[start])
        return spans

    def get_important_words(self):
        '''get nouns from the question'''
        words = []
        tokens = self.get_important_words_tokens()
        for span in tokens:
            words.append(span.text)
        return words

    def get_search_pattern(self, words):
        pattern = []
        for word in words:
            word_pattern = {}
            for attr in self.search_attr:
                word_pattern[attr] = word
            pattern.append([word_pattern])
        return pattern

    def get_tokens_lemmas(self, tokens):
        lemmas = []
        for token in tokens:
            lemmas.append(token.lemma_)
        return lemmas

    def get_tokens_texts(self, tokens):
        texts = []
        for token in tokens:
            texts.append(token.text)
        return texts

    def get_raw_search_indexes(self, words, keywords_len):
        indexes= []
        matcher= Matcher(nlp.vocab)
        pattern = self.get_search_pattern(words)
        matcher.add("important_words_indexs", pattern)
        matches= matcher(self.doc)
        print(len(matches),"matched by raw indexes")
        for match_id, start, end in matches:
            indexes.append(start)
        return indexes

    def get_sub_indexes(self, indexes, sub_size):
        sub_indexes = []
        for i in range(0,len(indexes)):
            if i == len(indexes)-sub_size+1:
                return sub_indexes
            else:
                sub_indexes.append(indexes[i:i+sub_size])
        return sub_indexes

    def get_indexes_average(self,indexes):
        indexes_diff = []
        length = len(indexes)
        for i in range(length):
            if i!= length -1:
                indexes_diff.append(abs(indexes[i+1] - indexes[i] ))
        if len(indexes_diff) == 0:
            return 100000#make it be removed
        return  sum(indexes_diff)/len(indexes_diff)

    def clean_indexes(self, indexes):
        '''[[indexes], [indexes2]]'''
        cleaned = []
        length = len(indexes)
        for i in range(0,length):
            is_junk = False

            if length > 1:
                if i == 0:
                    if abs(indexes[i+1] - indexes[i]) > self.words_limit:
                        is_junk = True

                elif i > 0 and i < length -1:
                    if abs(indexes[i+1] - indexes[i])  > self.words_limit and abs( indexes[i-1] - indexes[i]) > self.words_limit:
                        is_junk = True
                elif i == length - 1:
                    if abs(indexes[i] - indexes[i-1]) > self.words_limit:
                        is_junk = True

            if not is_junk:
                cleaned.append(indexes[i])
        return cleaned

    def get_indexes_words(self, indexes):
        words = []
        for index in indexes:
            words.append(self.doc[index])
        return words

    def clean_sub_indexes(self, indexes, tokens):
        '''This function function depends on search used'''
        cleaned_indexes = []
        cleaned_indexes_lemmas = []
        tokens_lemmas =  self.get_tokens_lemmas(tokens)
        for index in indexes:
            index_word_lemma = self.doc[index].lemma_
            cleaned_count = cleaned_indexes_lemmas.count(index_word_lemma)
            lemmas_count = tokens_lemmas.count(index_word_lemma)

            if  cleaned_count == 0 or cleaned_count <  lemmas_count:
                cleaned_indexes_lemmas.append(index_word_lemma)
                cleaned_indexes.append(index)
        return self.clean_indexes(cleaned_indexes)

    def clean_all_sub_indexes(self, indexes, tokens):
        cleaned_indexes = []
        for index in indexes:
            cleaned_indexes.append(self.clean_sub_indexes(index,tokens))
        return cleaned_indexes

    def sort_idexes_by_length(self, indexes):
        '''sort indexes by length of the indexes list'''
        indexes.sort(key=lambda x: (len(x)))
        indexes.reverse()
        return indexes

    def filter_indexes_by_max_length(self, indexes, length=None):
        filter = []
        sorted_indexes = self.sort_idexes_by_length(indexes)
        if length == None:
            if len(sorted_indexes) != 0:
                length = len(sorted_indexes[0])
        for index_ in sorted_indexes:
            if len(index_) < length:
                break
            else:
                filter.append(index_)
        return filter

    def break_indexes_by_arrangement(self, indexes):
        '''working not as expected'''
        broken = []
        last_break = 0
        for i in range(1,len(indexes)-1):
            if indexes[i] > indexes[i+1]:
                broken_index = indexes[last_break:i+1]
                broken.append(broken_index)
                last_break = i + 1
        if len(broken) == 0:
            return [indexes]

        else:
            return broken


    def free_indexes(self, indexes):
        for indexes in indexes:
            broken = self.break_indexes_by_arrangement(indexes)





    def is_indexes_answer(self, indexes):
        average =  self.get_indexes_average(indexes)
        if average <= self.words_limit:
            print(average)
            return True
        else:
            return False

    def get_processed_search_indexes(self, indexes):
        indexes = self.get_raw_search_indexes(words)
        cleaned_indexes = self.clean_indexes(indexes)
        splited_indexes = self.get_sub_indexes(cleaned_indexes, len(words))
        return splited_indexes

    def get_indexes_averages(self, indexes):
        averages = []

        for index in indexes:
            averages.append(self.get_indexes_average(indexes))
        return averages

    def sort_sub_indexes_by_average(self, indexes):
        indexes.sort(key=lambda x: (self.get_indexes_average(x)))
        return indexes

    def get_correct_indexes(self, indexes):
        correct_indexes  = []
        for sub_indexes in indexes:
            if self.is_indexes_answer(sub_indexes):
                correct_indexes.append(sub_indexes)
        return correct_indexes

    def get_sub_indexes_boundary(self, indexes):
        if len(indexes) == 1:
            return indexes
        elif len(indexes) > 1:
            return [indexes[0], indexes[-1]]
        else:
            return []

    def get_boundary_sents_indexes(self, indexes):
        boundaries = self.get_sub_indexes_boundary(indexes)
        if len(boundaries) > 1:
            start_sent = self.doc[boundaries[0]].sent
            end_sent = self.doc[boundaries[-1]].sent
            return [start_sent.start, end_sent.end]
        elif len(boundaries) == 1:
            return self.doc[boundaries[0]].sent.start
        else:
            return []

    def get_indexes_span(self, indexes):
        length = len(indexes)
        if length == 1:
            print(type(self.doc[indexes[0]:indexes[0]+1]))
            return self.doc[indexes[0]:indexes[0]+1]
        elif  length > 1:
            return self.doc[indexes[0]:indexes[-1]+1]
        else:
            return None

    def get_indexes_text(self, indexes):
        answer_span = self.get_indexes_span(indexes)
        if answer_span != None:
            return answer_span.text

    def get_indexes_span_full(self, indexes):
        length = len(indexes)
        if length == 1:
            #remember sent is a span in spacy
            return self.doc[indexes[0]:indexes[0]+1].sent
        elif  length > 1:
            start_sent = self.doc[indexes[0]].sent
            end_sent = self.doc[indexes[-1]+1].sent
            return self.doc[start_sent.start:end_sent.end]
        else:
            return None


    def get_indexes_spans_full(self, indexes):
        spans = []
        for sub_indexes in indexes:
            answer_span = self.get_indexes_span_full(sub_indexes)
            if answer_span != None:
                spans.append(answer_span)
        return spans


    def get_indexes_spans(self, indexes):
        spans = []
        for sub_indexes in indexes:
            answer_span = self.get_indexes_span(sub_indexes)
            if answer_span != None:
                spans.append(answer_span)
        return spans


    def get_words(self, tokens):
        words = self.get_tokens_texts(tokens)
        words_ = []
        indexes = self.get_processed_search_indexes(words)
        indexes = self.clean_all_sub_indexes(indexes, tokens)
        indexes = self.sort_idexes_by_length(indexes)
        indexes = self.filter_indexes_by_max_length(indexes)
        indexes = self.get_correct_indexes(indexes)
        for sub_indexes in indexes:
            sub_words = []
            for index in sub_indexes:
                sub_words.append(self.doc[index].sent)
            words_.append(sub_words)
        return words_



class Question(Processing):
    """docstring for Question. Perform operations on the question text"""

    def __init__(self, source, text):
        super(Question, self).__init__(source, text.lower())
        self.important_words = self.get_important_words()

    def get_syno_important_words_tokens(self):
        syno_words_tokens = []
        tokens = self.get_important_words_tokens()
        # For each token in the sentence
        for token in tokens:
            # We get those synsets within the desired domains
            synsets = token._.wordnet.synsets()
            if not synsets:
                syno_words_tokens.append(token.text)
            else:
                lemmas_for_synset = set([lemma for s in synsets for lemma in s.lemma_names()])
                # If we found a synset in the economy domains
                # we get the variants and add them to the enriched sentence
                for lemma in lemmas_for_synset:
                    syno_words_tokens.append(lemma)
        doc = nlp(" ".join(syno_words_tokens))
        return doc
    
    def get_syno_important_words(self):
        words = []
        for token in self.get_syno_important_words_tokens():
            words.append(token.text)
        return words


class Knowledge(Processing):
    """docstring for Question. Perform operations on the knowledge text"""
    def __init__(self, source, text):
        super(Knowledge, self).__init__(source, text)
        self.source = source





class Search_base(object):
    """docstring for Search_base."""

    def __init__(self, knowledge_map, questions_map):
        super(Search_base, self).__init__()
        self.knowledge_map = knowledge_map
        self.questions_map = questions_map
        self.knowledge_processings = self.get_knowledge_processings()
        self.questions_processings = self.get_questions_processings()

    def get_knowledge_processings(self):
        processings =[]
        for source, text in self.knowledge_map.get_items():
            processings.append(Knowledge(source, text))
        return processings

    def get_questions_processings(self):
        processings = []
        for source, text in self.questions_map.get_items():
            processings.append(Question(source, text))
        return processings

    def search_answer(self, knowledge_processing, questions_processing):
        search_indexes = knowledge_processing.get_processed_search_indexes

if __name__ == "__main__":
    text=  'who is the main character of no longer at ease?'
    resources = resources_manager.Data_manager("ekdfhedhfnewjdbfcnwjesdbfjd")
    # search = Search_base(resources.knowledge_json_typed_data, resources.questions_json_typed_data)
    # p = Processing("ewwwwss",text)
    # items = [222, 33,45,6566,5577,78,90]
    sub_items = [[33,700,3234,24354],[2344,2,44,456,564,567,678],[33,65,77,5,7,22,43]]
    # print(p.break_indexes_by_arrangement(items))
    # items.sort()

    resources = resources_manager.Data_manager("kevin ekdfhedhfnewjdbfcnwjesdbfjd")
    data = resources.knowledge_text_data.get_map()
    source = "users\\kevin ekdfhedhfnewjdbfcnwjesdbfjd\\knowledge\\text\\l21st century learning environments  1 .pdf.txt"
    text = data[source]
    knowledge = Knowledge(source, text)
    question_text = '''The term “learning environment” suggests place and space – a school, 
a  learning takes 
place in physical locations like these. But in today‟s  all. Perhaps a 
'''
    question = Question(source, question_text)
    words = question.get_important_words()
    tokens = question.get_important_words_tokens()
    indexes = knowledge.get_raw_search_indexes(words, len(question.get_important_words()))
    grouped_indexes  = knowledge.get_sub_indexes(indexes, len(words))
    cleaned_indexes = knowledge.clean_all_sub_indexes(grouped_indexes, tokens)
    filtered_grouped_indexes = knowledge.filter_indexes_by_max_length(cleaned_indexes)
    average_sorted_indexes = knowledge.sort_sub_indexes_by_average(cleaned_indexes)
    # print(len(average_sorted_indexes))
    # print(average_sorted_indexes)

    # print(knowledge.doc[2195:2197+1].sent)
    #print(question.get_syno_important_words_tokens())
    print(tokens)
    print(indexes)
    print(question.text)

    print(len(indexes),"raw indexes")
    print(len(grouped_indexes),"grouped_indexes")
    print(len(cleaned_indexes),"cleaned_indexes")
    print(len(filtered_grouped_indexes),"filtered_grouped_indexes")
    print(len(average_sorted_indexes),"average_sorted_indexes")

    spans = knowledge.get_indexes_spans_full( average_sorted_indexes)
    # words = knowledge.get_words(question.get_important_words_tokens())
    print(len(spans))
    for span in spans:
        if spans.index(span) < 6:
            print(span.text, spans.index(span))
            print('\n_____________________________________new__________________________')
        else:
            break
