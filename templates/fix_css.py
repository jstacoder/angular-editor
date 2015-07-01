# coding: utf-8
import os
from bs4 import BeautifulSoup,Tag

get_file_bs = lambda name: BeautifulSoup(open(name,'r').read(),'html.parser')
get_bs = lambda s: BeautifulSoup(s,'html.parser')
remove_style_newlines = lambda s: s.replace('\n','').replace('\t','').replace(' ','')
has_style_tags = lambda bs: bool(filter(lambda x: x.name=='style',list(bs.descendants)))
get_style_tags = lambda bs: filter(lambda x: x.name=='style',list(bs.descendants))
new_tag = lambda name: Tag(name=name)
children_have_style = lambda bs: any(filter(lambda x: x.name == 'style',list(bs.children)))
filter_children = lambda bs: filter(lambda x: (x not in list(bs.children) or x == '\n'),list(bs.descendants))



def fix_css(html_file):
    styles = []
    rtn = []
    if isinstance(html_file,basestring):
        if os.path.isfile(html_file):
            bs = get_file_bs(html_file)
        else:
            bs = get_bs(html_file)
    else:
        bs = html_file
    if has_style_tags(bs):
        styles = get_style_tags(bs)
    if styles:
        for s in styles:            
            if s and s.contents:
                _bs = s.parent
                idx = _bs.index(s)
                txt = str(s.contents[0])
                s.extract()
                tag = new_tag('style')
                print 'processing ',s.name
                tag.insert(0,remove_style_newlines(txt).strip())
                _bs.insert(idx,tag)                
    return str(bs)

