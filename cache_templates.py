# coding: utf-8
import json
import os
import sys
from htmlmin import minify
from cssmin import cssmin
from bs4 import BeautifulSoup,Tag

get_file_bs = lambda name: BeautifulSoup(open(name,'r').read(),'html.parser')
get_bs = lambda s: BeautifulSoup(s,'html.parser')
remove_style_newlines = lambda s: s.replace('\n','').replace('\t','').replace(' ','')
has_style_tags = lambda bs: bool(filter(lambda x: x.name=='style',list(bs.descendants)))
get_style_tags = lambda bs: filter(lambda x: x.name=='style',list(bs.descendants))
new_tag = lambda name: Tag(name=name)

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


NODE_FUNC_TEMPLATE = (
"var t = %s,"
"templates = JSON.parse(t).templates;"
"Object.keys(templates).forEach(function(itm){console.log(templates[itm]);});"
)

CACHE_FUNC_TEMPLATE = (
"angular.module('%s').run(['$templateCache',function($templateCache){"
"    $templateCache.put('%s',"
"'%s');\n}]);"
)

FUNC_TEMPLATE = (
"var t = %s;"
"angular.module('%s').run(['$templateCache',function($templateCache){"
"    var templates = JSON.parse(t).templates;"
"    angular.forEach(templates,function(val,key){"
"        $templateCache.put(key,val);"
"    });"
"}]);"
)


process_quotes = lambda s: s.replace("'","\\'")

cache_template =\
    lambda template,name,module:\
            (CACHE_FUNC_TEMPLATE % (module,name,(fix_css(minify(process_quotes(open(template,'r').read()))))))

def gather_templates(dirname=None):
    html = []
    if dirname is None:
        dirname = os.path.realpath(os.getcwd())
    for fle in os.listdir(dirname):
        if fle.endswith('.html'):
            html.append(
                (os.path.join(dirname,fle))
            )
    return html

def minify_templates(dirname,module):
    '''
        add all templates in :dirname to :modules templates cache
    '''
    html = gather_templates(dirname)
    rtn = ''
    brk = '\n'
    for itm in html:
        if not itm.endswith('.min.html'):
            rtn +=\
                cache_template(
                        itm,
                        os.path.basename(itm),
                        module
                ) + brk            
    return rtn

DEFAULT_OUT_FILE = 'all.min.html'

def do_min(module,dirname=None,outfile=None):
    outfile = outfile or DEFAULT_OUT_FILE
    with open(outfile,'w') as out:
        out.write(minify_templates(dirname or os.getcwd(),module))
    print 'all done'

def main():
    module,outfile = None,None
    args = (len(sys.argv) > 1) and sys.argv[1:]
    if args:
        if len(args) == 1:
            module = args[0]
        elif len(args) == 2:
            module,outfile = args
        do_min(module,None,outfile)
        return
    print 'Usage: %s MODULE [OUTFILE][default: %s]' %\
                    (sys.argv[0],DEFAULT_OUT_FILE)

get_files = lambda name: [x for x in os.listdir(name) if x.endswith('.html')]
_get_data = lambda name: {x:open(os.path.join(name,x),'r').read().decode('utf8') for x in (lambda name: [x for x in os.listdir(name) if x.endswith('.html')])(name)}
mini = lambda name: {x[0]: cssmin(minify(x[1])) for x in (lambda name:
    {x:open(os.path.join(name,x),'r').read().decode('utf8') for x in (lambda name:
    [x for x in os.listdir(name) if x.endswith('.html')])(name)})(name).items()}
get_data = lambda name: mini(name)

def tst_data():
    files = get_files('./templates')
    for f in files:
        try:
            minify(open(os.path.join('templates',f),'r').read().encode('utf8'))
            print 'success: ',f
        except UnicodeDecodeError, e:
            print 'fail: ',f
            print e

make_template = lambda name: FUNC_TEMPLATE  % (repr(json.dumps(dict(templates=mini(name)))),'editor.app')

def main():
    open('all.html.js','w').write(make_template('./templates'))

if __name__ == "__main__":
    main()
