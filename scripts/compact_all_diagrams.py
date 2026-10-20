"""Pack the three existing UML views without changing their model or signatures."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/asteroid-dates-lab3.mdj'
ARCH = '2yoi+fPTSBOLpaxp+Q730A=='
ERD = 'tzyJ0WXBQIinwi3ueSnYwA='
SEQ = 'asteroid-http-diagram'


def index(project):
    objects = {}
    def walk(value):
        if isinstance(value, dict):
            if '_id' in value:
                assert value['_id'] not in objects
                objects[value['_id']] = value
            for child in value.values(): walk(child)
        elif isinstance(value, list):
            for child in value: walk(child)
    walk(project)
    return objects


def nested(view):
    yield view
    for child in view.get('subViews', []): yield from nested(child)


def node(view, x, y, w, h, font):
    view.update(left=x, top=y, width=w, height=h, font=f'Arial;{font};0', parentStyle=False)
    for child in nested(view):
        if child is view: continue
        child.update(left=x+5, top=y+5, width=max(1,w-10), height=font,
                     font=f'Arial;{font};0', parentStyle=True)


def compact_arch(objects):
    rects = {
        'FPz129EkTYeytWO+IA/kvQ==': (20,20,600,116),
        '6B4GjPbnQLWG0YlyS1RK1w==': (20,215,600,185),
        'GrMNNihyQyKaK39K+T05gg==': (20,419,600,94),
        '+m+lo6c2R/Wa5LMSnqN+dA==': (20,543,600,112),
        '7/Y1/xzmTNqOeAl9W9N5VA==': (34,56,130,66),
        'dBMmpiHFRwuNO0TERvy/tg==': (180,56,130,66),
        '6EBJzmmfTy+6YKo/+AICNA==': (326,56,130,66),
        'PN/bmUF0RVy3MbE+69PaKQ==': (472,56,130,66),
        'LBYWk4E0Rsuqq/oR7jAbIg==': (156,153,108,48),
        'uoMQ/5TVQoqEE9vHe0IuxA==': (480,153,108,48),
        'WI7jfvF6RSmvOmw9bxVW+w==': (34,254,270,128),
        '0MPbbbcdQDu3/+CtH/LVKA==': (332,275,270,88),
        '1Cvo65lSS3abWpUqnkYEbg==': (34,461,132,44),
        'U3HL+DPHQLCqvuIsujFvOw==': (230,461,168,44),
        '2G3RpRaHSeO4Aggcge9MLQ==': (466,461,136,44),
        'kIYFTdU+SIa1KKLnUbSlcA==': (34,581,132,36),
        '4DHEg7RKQUOFoAqvNJp5fQ==': (230,581,168,36),
        'ZXlRxQKITlugw6aUEQrRWQ==': (466,581,136,36),
    }
    for uid, rect in rects.items():
        view=objects[uid]
        font=12 if view['_type']=='UMLPackageView' else 11
        if view['_type']=='UMLInterfaceView': font=10
        node(view,*rect,font)
        comp=objects[view['nameCompartment']['$ref']]
        objects[comp['nameLabel']['$ref']]['font']=f'Arial;{font};1'
        if view['_type']=='UMLClassView' and 'operationCompartment' in view:
            for child in nested(objects[view['operationCompartment']['$ref']]):
                child.update(font='Arial;10;0',parentStyle=False)
    points={
        'Lg/HrPW+Sua8hgXcFT8qqQ==':'99:122;210:168',
        'GlqQhLSmQLmmCSmCq4l5kQ==':'245:122;210:168',
        'My0nPpbNQm+2O7ZfzWX3iw==':'391:122;210:168',
        'NrMApNPcT+GHAoIiJvlYcg==':'537:122;534:168',
        'P64r9380THWWV6mOEwuD2Q==':'210:254;210:180',
        'n2mu+dPaTgqtROCvScEjLQ==':'467:275;534:180',
        'TyUPz28jRyC4P4wm9xSC0Q==':'100:382;100:461',
        'npuYdUy8T+SvXL9kzDg9uw==':'275:382;265:418;265:461',
        'xw3wjM25TACWypeig3LTdg==':'467:363;534:461',
        '8iHJe5rhRjafoLJsmRMS0w==':'100:505;100:581',
        'fmLa8JuoQTy/wx6hYcfaug==':'390:505;390:529;390:563;390:581',
        'd+HM7VgwTduogHioSSNtNg==':'534:505;534:581',
        'Oq989Jo+TXyto8zAG/paxw==':'166:599;230:599',
        'J2elTIlvTBqpYa1Aj/4zuw==':'466:599;398:599',
        'oq1B9i49SkaW1XlzTtsw3g==':'534:617;534:638;100:638;100:617',
    }
    for uid, coords in points.items():
        edge=objects[uid]
        edge.update(points=coords,font='Arial;10;0')
        for child in edge.get('subViews',[]):
            child.update(font='Arial;10;0',parentStyle=True)
            if child['_type']=='EdgeLabelView':
                child.update(height=10,width=6 if child.get('text')=='1' else 20)
        for field in ['tailMultiplicityLabel','headMultiplicityLabel']:
            if field in edge:objects[edge[field]['$ref']]['distance']=13


def compact_erd(objects):
    diagram=objects[ERD]
    positions={'observers':(20,20,240,82),
               'asteroid_dates':(320,20,280,174),
               'observer_date_likes':(20,146,240,70)}
    for view in diagram['ownedViews']:
        if view['_type']=='ERDEntityView':
            name=objects[view['model']['$ref']]['name']
            node(view,*positions[name],11)
            objects[view['nameLabel']['$ref']]['font']='Arial;11;1'
        elif view['_type']=='ERDRelationshipView':
            source=objects[objects[view['tail']['$ref']]['model']['$ref']]['name']
            target=objects[objects[view['head']['$ref']]['model']['$ref']]['name']
            points={('observers','asteroid_dates'):'260:61;320:61',
                    ('observers','observer_date_likes'):'140:102;140:146',
                    ('asteroid_dates','observer_date_likes'):'320:180;260:180'}
            view.update(points=points[source,target],lineStyle=0,font='Arial;11;0')
            for child in view['subViews']:
                child.update(font='Arial;11;0',parentStyle=True,distance=14,height=11,
                             width=7 if child.get('edgePosition')==2 else 22,visible=False)


def compact_sequence(objects):
    diagram=objects[SEQ]
    frame=objects['asteroid-http-frame']
    node(frame,20,10,670,644,11)
    centers={'frontend':90,'users':320,'dates':590}
    widths={'frontend':104,'users':144,'dates':166}
    line_keys={}
    for key,x in centers.items():
        view=objects[f'asteroid-http-{key}-view']
        w=widths[key]
        node(view,x-w/2,40,w,600,11)
        comp=objects[view['nameCompartment']['$ref']]
        objects[comp['nameLabel']['$ref']]['font']='Arial;11;1'
        line=objects[view['linePart']['$ref']]
        line.update(left=x,top=80,width=1,height=560)
        line_keys[line['_id']]=key
    for view in diagram['ownedViews']:
        if view['_type']!='UMLSeqMessageView':continue
        message=objects[view['model']['$ref']]
        number=int(message['sequenceNumber'])
        pair=(number-1)//2
        reply=number%2==0
        y=108+68*pair+(24 if reply else 0)
        source=line_keys[view['tail']['$ref']]
        target=line_keys[view['head']['$ref']]
        x1,x2=centers[source],centers[target]
        view.update(points=f'{x1}:{y};{x2}:{y}',font='Arial;11;0')
        for field in ['nameLabel','stereotypeLabel','propertyLabel']:
            lab=objects[view[field]['$ref']]
            lab.update(font='Arial;11;0',parentStyle=True,left=min(x1,x2)+8,
                       top=y-22,width=abs(x2-x1)-20,height=11,distance=13,wordWrap=True)
        active=objects[view['activation']['$ref']]
        active.update(left=x2-7,top=y,width=14,height=0 if reply else 36)


def main():
    project=json.loads(SOURCE.read_text())
    objects=index(project)
    # View-only changes: keep every domain field, relationship, and message intact.
    def semantics(value):
        if isinstance(value,dict):
            if value.get('_type','').endswith(('View','Diagram')):return None
            return {key:semantics(child) for key,child in value.items()}
        if isinstance(value,list):
            return [result for child in value if (result:=semantics(child)) is not None]
        return value
    before=semantics(project)
    compact_arch(objects)
    compact_erd(objects)
    compact_sequence(objects)
    after=index(project)
    assert before==semantics(project)
    def check(value):
        if isinstance(value,dict):
            if '$ref' in value:assert value['$ref'] in after
            for child in value.values():check(child)
        elif isinstance(value,list):
            for child in value:check(child)
    check(project)
    for name,default in [('asteroid-dates-lab3.mdj',ARCH),
                         ('asteroid-dates-sequence.mdj',SEQ),
                         ('asteroid-dates-erd.mdj',ERD)]:
        for diagram in after.values():
            if diagram['_type'].endswith('Diagram'):
                diagram['defaultDiagram']=diagram['_id']==default
        (ROOT/'docs'/name).write_text(json.dumps(project,ensure_ascii=False,indent=2)+'\n')
    print('Packed ERD: 580 × 196; architecture: 600 × 635; sequence: 670 × 644.')
    print('All domain fields, relationships, 10 methods and 16 messages preserved.')


if __name__=='__main__':main()
