"""Compact the existing native StarUML LR3 architecture; keep all model references."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / 'docs/asteroid-dates-lab3.mdj'
project = json.loads(FILE.read_text())
objects = {}

def collect(value):
    if isinstance(value, dict):
        if '_id' in value:
            assert value['_id'] not in objects, value['_id']
            objects[value['_id']] = value
        for child in value.values(): collect(child)
    elif isinstance(value, list):
        for child in value: collect(child)
collect(project)

def obj(uid): return objects[uid]

def nested(value):
    yield value
    for child in value.get('subViews', []): yield from nested(child)

ARCH_ID = '2yoi+fPTSBOLpaxp+Q730A=='
diagram = obj(ARCH_ID)
project['name'] = 'Астероиды — ЛР3'
diagram['name'] = 'ЛР3 — архитектура веб-сервиса астероидов'
for element in objects.values():
    if element.get('_type', '').endswith('Diagram'):
        element['defaultDiagram'] = element['_id'] == ARCH_ID

names = {
    'qTrNhrTtRqSNSR2LEqTkVQ==': 'Лента дат сближения астероидов',
    'GJpOMAexR6KlrnOZx8cfrw==': 'Плитка дат сближения астероидов',
    '7LICYUZYR8Sw4bcEacZYpw==': 'Добавление даты сближения астероида',
    'LV5iQTlYSNqQXBow68ZZNA==': 'Авторизация наблюдателя',
    'Y5EV8t3XT06Rc4Fc9JQp3Q==': 'Веб-сервис',
    '3RD93J4ERcag4RXAcxpuGw==': 'Домен дат сближения астероидов',
    'D3UEizIiRoW2whJxicMO2w==': 'Домен наблюдателей',
    '4a7BpSR3QuOtgmAt4a4lGQ==': 'API дат сближения',
    'eeYD0y+3S8+5/zgC9qew/w==': 'API наблюдателей'
}
for uid, name in names.items(): obj(uid)['name'] = name

# The four bands follow the reference, with a portrait aspect ratio.
rectangles = {
    'FPz129EkTYeytWO+IA/kvQ==': (20,20,700,136),
    '6B4GjPbnQLWG0YlyS1RK1w==': (20,258,700,226),
    'GrMNNihyQyKaK39K+T05gg==': (20,520,700,122),
    '+m+lo6c2R/Wa5LMSnqN+dA==': (20,686,700,154),
    # Frontend order matches the sample: feed, tile, add, authentication.
    '7/Y1/xzmTNqOeAl9W9N5VA==': (44,64,134,72),
    'dBMmpiHFRwuNO0TERvy/tg==': (218,64,134,72),
    '6EBJzmmfTy+6YKo/+AICNA==': (392,64,134,72),
    'PN/bmUF0RVy3MbE+69PaKQ==': (566,64,134,72),
    'LBYWk4E0Rsuqq/oR7jAbIg==': (176,178,118,60),
    'uoMQ/5TVQoqEE9vHe0IuxA==': (574,178,118,60),
    'WI7jfvF6RSmvOmw9bxVW+w==': (44,300,330,154),
    '0MPbbbcdQDu3/+CtH/LVKA==': (408,330,292,100),
    '1Cvo65lSS3abWpUqnkYEbg==': (44,566,180,54),
    'U3HL+DPHQLCqvuIsujFvOw==': (278,566,184,54),
    '2G3RpRaHSeO4Aggcge9MLQ==': (530,566,168,54),
    'kIYFTdU+SIa1KKLnUbSlcA==': (44,730,180,54),
    '4DHEg7RKQUOFoAqvNJp5fQ==': (278,730,184,54),
    'ZXlRxQKITlugw6aUEQrRWQ==': (530,730,168,54)
}
for uid, (x,y,w,h) in rectangles.items():
    view = obj(uid)
    view.update(left=x, top=y, width=w, height=h, wordWrap=True,
                showNamespace=False, showProperty=False, fillColor='#ffffff', lineColor='#222222')
    font_size = 14 if view['_type']=='UMLPackageView' else 12
    if view['_type']=='UMLInterfaceView': font_size=11
    view['font'] = f'Arial;{font_size};0'
    view['parentStyle'] = False
    # Clear obsolete dimensions in embedded labels; StarUML then recomputes wrapped sizes.
    for part in nested(view):
        if part is view: continue
        part.update(left=x, top=y, width=w-10, height=10)
        part['font'] = f'Arial;{font_size};0'
        part['parentStyle'] = True
        if part['_type'] in ['UMLNameCompartmentView','LabelView']:
            part['wordWrap'] = True
    comp = obj(view['nameCompartment']['$ref'])
    comp.update(wordWrap=True)
    label = obj(comp['nameLabel']['$ref'])
    label.update(text=obj(view['model']['$ref'])['name'], font=f'Arial;{font_size};1')
    for label_name in ['namespaceLabel','propertyLabel','stereotypeLabel']:
        obj(comp[label_name]['$ref'])['visible'] = False
    if view['_type']=='UMLClassView':
        view.update(suppressAttributes=False, suppressOperations=False, suppressReceptions=True)
        for field in ['attributeCompartment','operationCompartment']:
            obj(view[field]['$ref'])['visible'] = True
        if uid in ['kIYFTdU+SIa1KKLnUbSlcA==','4DHEg7RKQUOFoAqvNJp5fQ==','ZXlRxQKITlugw6aUEQrRWQ==']:
            view.update(suppressAttributes=True, suppressOperations=True)
            for field in ['attributeCompartment','operationCompartment']:
                obj(view[field]['$ref'])['visible'] = False
        if obj(view['model']['$ref']).get('operations'):
            for part in nested(obj(view['operationCompartment']['$ref'])):
                part['font'] = 'Arial;11;0'
                part['parentStyle'] = False
    elif view['_type']=='UMLInterfaceView':
        view.update(suppressAttributes=True, suppressOperations=True, stereotypeDisplay='icon')
        label['font'] = 'Arial;11;3'

# Preserve every original relationship, but remove obsolete bends and long horizontal runs.
points = {
    'Lg/HrPW+Sua8hgXcFT8qqQ==': '111:136;235:196',
    'GlqQhLSmQLmmCSmCq4l5kQ==': '285:136;235:196',
    'My0nPpbNQm+2O7ZfzWX3iw==': '459:136;235:196',
    'NrMApNPcT+GHAoIiJvlYcg==': '633:136;633:196',
    'P64r9380THWWV6mOEwuD2Q==': '235:300;235:210',
    'n2mu+dPaTgqtROCvScEjLQ==': '554:330;633:210',
    'TyUPz28jRyC4P4wm9xSC0Q==': '134:454;134:566',
    'npuYdUy8T+SvXL9kzDg9uw==': '340:454;310:500;310:566',
    'xw3wjM25TACWypeig3LTdg==': '554:430;614:566',
    '8iHJe5rhRjafoLJsmRMS0w==': '134:620;134:730',
    'fmLa8JuoQTy/wx6hYcfaug==': '430:620;430:660;430:700;430:730',
    'd+HM7VgwTduogHioSSNtNg==': '614:620;614:730',
    'Oq989Jo+TXyto8zAG/paxw==': '224:757;278:757',
    'J2elTIlvTBqpYa1Aj/4zuw==': '530:757;462:757',
    'oq1B9i49SkaW1XlzTtsw3g==': '614:784;614:814;134:814;134:784'
}
for uid, coords in points.items():
    edge = obj(uid)
    edge.update(points=coords, lineStyle=1, font='Arial;11;0', lineColor='#222222',
                showProperty=False, showType=False)
    if uid=='fmLa8JuoQTy/wx6hYcfaug==':
        # Orthogonal junctions retain the attachment offset past the package title.
        edge['lineStyle']=0
    if edge['_type']=='UMLAssociationView': edge['showMultiplicity'] = True
    for field in ['nameLabel','stereotypeLabel','propertyLabel','tailRoleNameLabel','headRoleNameLabel','tailPropertyLabel','headPropertyLabel']:
        if field in edge: obj(edge[field]['$ref'])['visible'] = False
    if edge['_type']=='UMLAssociationView':
        reverse = uid != 'Oq989Jo+TXyto8zAG/paxw=='
        for field, sign in [('tailMultiplicityLabel',-1 if reverse else 1),('headMultiplicityLabel',1 if reverse else -1)]:
            label = obj(edge[field]['$ref'])
            label.update(width=8 if label.get('text')=='1' else 24, height=11,
                         distance=15, alpha=sign*0.65, visible=True)
        if uid=='oq1B9i49SkaW1XlzTtsw3g==':
            obj(edge['tailMultiplicityLabel']['$ref'])['alpha']=0.8
            obj(edge['headMultiplicityLabel']['$ref'])['alpha']=-0.8

# Machine-check the user-visible structure and all persisted StarUML references.
def check_refs(value):
    if isinstance(value,dict):
        if '$ref' in value: assert value['$ref'] in objects, value
        for child in value.values(): check_refs(child)
    elif isinstance(value,list):
        for child in value: check_refs(child)
check_refs(project)
frontend_ids = ['qTrNhrTtRqSNSR2LEqTkVQ==','GJpOMAexR6KlrnOZx8cfrw==','7LICYUZYR8Sw4bcEacZYpw==','LV5iQTlYSNqQXBow68ZZNA==']
for uid in frontend_ids:
    assert len(obj(uid)['name'].split()) > 1
    assert any(o.get('_type')=='UMLDependency' and o.get('source',{}).get('$ref')==uid for o in objects.values())
assert len(obj('3RD93J4ERcag4RXAcxpuGw==')['operations']) == 7
assert len(obj('D3UEizIiRoW2whJxicMO2w==')['operations']) == 3
FILE.write_text(json.dumps(project,ensure_ascii=False,indent=2)+'\n')
print(FILE)
print('Portrait architecture: 700 × 820, four frontend links, 7 + 3 API operations.')
