"""Add the reference-style HTTP sequence to the existing asteroid UML project.

The separate sequence file contains the same class model and operation IDs, so
call signatures are real StarUML references to the architecture's domain methods.
"""
from collections import Counter
from copy import deepcopy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/asteroid-dates-lab3.mdj'
OUTPUT = ROOT / 'docs/asteroid-dates-sequence.mdj'
project = json.loads(SOURCE.read_text())
objects = {}


def collect(value):
    if isinstance(value, dict):
        if '_id' in value:
            assert value['_id'] not in objects, value['_id']
            objects[value['_id']] = value
        for child in value.values():
            collect(child)
    elif isinstance(value, list):
        for child in value:
            collect(child)


collect(project)
model = objects['P9JXndMiSeCtuQYYeECgTA==']
model['ownedElements'] = [o for o in model['ownedElements']
                          if o['_id'] != 'asteroid-http-collaboration']
dates = objects['3RD93J4ERcag4RXAcxpuGw==']
users = objects['D3UEizIiRoW2whJxicMO2w==']
operations = {o['name']: o for domain in (dates, users) for o in domain['operations']}
assert Counter(name.split()[0] for name in operations) == {
    'GET': 3, 'POST': 5, 'PUT': 1, 'DELETE': 1,
}


def ref(obj):
    return {'$ref': obj['_id']}


def make(kind, uid, parent, **values):
    obj = {'_type': kind, '_id': f'asteroid-http-{uid}', '_parent': ref(parent)}
    obj.update(values)
    return obj


FONT = 'Arial;12;0'


def label(parent, uid, text='', **values):
    return make('LabelView', uid, parent, font=FONT, parentStyle=True,
                text=text, **values)


scenario = make('UMLCollaboration', 'collaboration', model,
                name='Публикация даты сближения астероида',
                attributes=[], ownedElements=[])
model['ownedElements'].append(scenario)
interaction = make('UMLInteraction', 'interaction', scenario,
                   name='Публикация даты сближения', participants=[], messages=[], ownedElements=[])
scenario['ownedElements'].append(interaction)
diagram = make('UMLSequenceDiagram', 'diagram', interaction,
               name='02 — Последовательность HTTP-запросов', ownedViews=[],
               showSequenceNumber=True, sequenceNumbering='custom',
               showSignature=True, showActivation=True, defaultDiagram=False)
interaction['ownedElements'].append(diagram)

# The frame and only three lifelines follow the supplied reference.
frame = make('UMLFrameView', 'frame', diagram, model=ref(interaction),
             left=20, top=10, width=800, height=874, font=FONT,
             lineColor='#222222', fillColor='#ffffff', subViews=[], zIndex=-1)
for field, text in [('nameLabel', interaction['name']), ('frameTypeLabel', 'sd')]:
    lab = label(frame, f'frame-{field}', text, left=26, top=15,
                width=220 if field == 'nameLabel' else 16, height=12)
    frame[field] = ref(lab)
    frame['subViews'].append(lab)
diagram['ownedViews'].append(frame)

lifelines, lineparts, centers = {}, {}, {}
for key, cls, x, width in [('frontend', None, 110, 124),
                          ('users', users, 400, 170),
                          ('dates', dates, 700, 188)]:
    if cls:
        role = make('UMLAttribute', f'{key}-role', scenario, name='', type=ref(cls))
        scenario['attributes'].append(role)
    line = make('UMLLifeline', f'{key}-lifeline', interaction,
                name='Фронтенд' if cls is None else '')
    if cls:
        line['represent'] = ref(role)
    interaction['participants'].append(line)
    view = make('UMLSeqLifelineView', f'{key}-view', diagram, model=ref(line),
                left=x-width/2, top=40, width=width, height=830, font=FONT,
                fillColor='#ffffff', lineColor='#222222', parentStyle=False,
                wordWrap=True, showType=True, showNamespace=False, showProperty=False,
                subViews=[])
    title = 'Фронтенд' if cls is None else ': ' + cls['name']
    comp = make('UMLNameCompartmentView', f'{key}-name', view, model=ref(line),
                left=x-width/2, top=40, width=width, height=40, font=FONT,
                wordWrap=True, parentStyle=True, subViews=[])
    for field in ['stereotypeLabel', 'nameLabel', 'namespaceLabel', 'propertyLabel']:
        lab = label(comp, f'{key}-{field}', title if field=='nameLabel' else '',
                    visible=field=='nameLabel', left=x-width/2+5, top=47,
                    width=width-20, height=24, wordWrap=True)
        comp[field] = ref(lab)
        comp['subViews'].append(lab)
    view['nameCompartment'] = ref(comp)
    view['subViews'].append(comp)
    part = make('UMLLinePartView', f'{key}-line', view, model=ref(line),
                left=x, top=80, width=1, height=790, font=FONT,
                lineColor='#222222', parentStyle=True)
    view['linePart'] = ref(part)
    view['subViews'].append(part)
    diagram['ownedViews'].append(view)
    lifelines[key], lineparts[key], centers[key] = line, part, x

# Each call uses the *existing* domain operation as its signature. Replies are
# reply messages with status in name and output data in arguments, as in the sample.
flows = [
    ('users', 'POST /api/users/auth', 'email, password',
     '200 JSON', 'authenticated=1, observer; Set-Cookie: asteroids.sid'),
    ('dates', 'GET /api/dates', 'maxMonth=7',
     '200 JSON', 'data=[{id, designation, isCreator=0/1}]'),
    ('dates', 'POST /api/dates', 'designation; image: File, video: File',
     '201 JSON', 'data={id, status=draft, creatorId, imageUrl, videoUrl}'),
    ('dates', 'GET /api/dates/draft', '',
     '200 JSON', 'data={id, designation, status=draft, imageUrl, videoUrl}'),
    ('dates', 'PUT /api/dates/publish',
     'shortDescription, approachMonth, approachDay, minimumDistanceAu',
     '200 JSON', 'data={id, status=published, formedAt, обновлённые поля}'),
    ('dates', 'GET /api/dates/feed', '',
     '200 JSON', 'data=[первая карточка астероида, isLiked=0/1]'),
    ('dates', 'GET /api/dates/feed', 'id=2, next=true',
     '200 JSON', 'data=[следующая карточка астероида, isLiked=0/1]'),
    ('dates', 'POST /api/dates/:id/like', 'id=2, like=1',
     '200 JSON', 'data={like=1, date:{isLiked=1, likesCount}}'),
]

for pair, (domain, operation_name, args, status, output) in enumerate(flows):
    for reply in (False, True):
        number = pair*2 + int(reply) + 1
        source, target = (domain, 'frontend') if reply else ('frontend', domain)
        y = 130 + pair*94 + (32 if reply else 0)
        message = make('UMLMessage', f'message-{number:02}', interaction,
                       name=status if reply else operation_name,
                       source=ref(lifelines[source]), target=ref(lifelines[target]),
                       arguments=output if reply else args,
                       messageSort='reply' if reply else 'synchCall',
                       sequenceNumber=str(number))
        if not reply:
            message['signature'] = ref(operations[operation_name])
        interaction['messages'].append(message)
        view = make('UMLSeqMessageView', f'message-{number:02}-view', diagram,
                    model=ref(message), tail=ref(lineparts[source]), head=ref(lineparts[target]),
                    font=FONT, parentStyle=False, lineColor='#222222', fillColor='#ffffff',
                    points=f'{centers[source]}:{y};{centers[target]}:{y}',
                    lineStyle=0, showType=False, showProperty=False, subViews=[])
        for field, distance in [('nameLabel',20), ('stereotypeLabel',34), ('propertyLabel',12)]:
            lab = make('EdgeLabelView', f'message-{number:02}-{field}', view,
                       model=ref(message), font=FONT, parentStyle=True,
                       text='', visible=field=='nameLabel',
                       left=min(centers[source],centers[target])+8, top=y-30,
                       width=abs(centers[target]-centers[source])-24, height=24,
                       wordWrap=True, hostEdge=ref(view), edgePosition=1,
                       distance=distance, alpha=1.5707963267948966)
            view[field] = ref(lab)
            view['subViews'].append(lab)
        active = make('UMLActivationView', f'message-{number:02}-activation', view,
                      model=ref(message), visible=not reply, font=FONT,
                      left=centers[target]-7, top=y, width=14, height=48 if not reply else 0,
                      fillColor='#ffffff', lineColor='#222222')
        view['activation'] = ref(active)
        view['subViews'].append(active)
        diagram['ownedViews'].append(view)


def validate(value):
    if isinstance(value, dict):
        if '$ref' in value:
            assert value['$ref'] in objects, value
        for child in value.values():
            validate(child)
    elif isinstance(value, list):
        for child in value:
            validate(child)


objects.clear()
collect(project)
validate(project)
assert len(interaction['participants']) == 3
assert len(interaction['messages']) == 16
for pair, (domain, operation, *_rest) in enumerate(flows):
    call, reply = interaction['messages'][pair*2:pair*2+2]
    assert call['signature'] == ref(operations[operation])
    assert call['messageSort'] == 'synchCall' and reply['messageSort'] == 'reply'
    assert call['target'] == reply['source'] and call['source'] == reply['target']

# Keep the original architecture as the first/default diagram in the first file.
SOURCE.write_text(json.dumps(project, ensure_ascii=False, indent=2)+'\n')
sequence_project = deepcopy(project)


def activate_sequence(value):
    if isinstance(value, dict):
        if value.get('_type','').endswith('Diagram'):
            value['defaultDiagram'] = value['_id'] == diagram['_id']
        for child in value.values():
            activate_sequence(child)
    elif isinstance(value, list):
        for child in value:
            activate_sequence(child)


activate_sequence(sequence_project)
OUTPUT.write_text(json.dumps(sequence_project, ensure_ascii=False, indent=2)+'\n')
print(OUTPUT)
print('3 lifelines; 8 calls with shared operation signatures; 8 replies; 8 activations.')
