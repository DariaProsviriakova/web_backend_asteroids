"""Build only the LR4 Postman collection and native StarUML model."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

def save(name, value):
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

items = []
def request(name, method, route, expected, body=None, private=False, extra=(), cookie=None):
    headers = []
    if private or cookie:
        headers.append({'key': 'Cookie', 'value': cookie or '{{sessionCookie}}'})
    req = {'method': method, 'header': headers, 'url': '{{baseUrl}}' + route,
           'protocolProfileBehavior': {'disableCookies': True},
           'description': 'Cookie jar отключён: передаётся только явный заголовок Cookie из переменной sessionCookie.'}
    if body is not None:
        if isinstance(body, list):
            req['body'] = {'mode': 'formdata', 'formdata': body}
        else:
            headers.append({'key': 'Content-Type', 'value': 'application/json'})
            req['body'] = {'mode': 'raw', 'raw': json.dumps(body, ensure_ascii=False, indent=2), 'options': {'raw': {'language': 'json'}}}
    status = f'pm.test("HTTP {expected}", () => pm.response.to.have.status({expected}));' if isinstance(expected, int) else 'pm.test("Создан или уже зарегистрирован", () => pm.expect([201, 409]).to.include(pm.response.code));'
    items.append({'name': name, 'request': req,
                  'protocolProfileBehavior': {'disableCookies': True},
                  'event': [{'listen': 'test', 'script': {'type': 'text/javascript', 'exec': [status, *extra]}}]})

publication = {'shortDescription': 'Астероид пройдёт рядом с Землёй 18 октября.', 'approachMonth': 10, 'approachDay': 18, 'minimumDistanceAu': 0.023}
request('01 Регистрация наблюдателя', 'POST', '/api/users/register', [201,409], {'fullName': '{{fullName}}', 'email': '{{email}}', 'password': '{{password}}'})
request('02 Вход (или вставьте cookie из Swagger в sessionCookie)', 'POST', '/api/users/auth', 200, {'email': '{{email}}', 'password': '{{password}}'}, extra=[
    'const setCookie = pm.response.headers.get("Set-Cookie");',
    'if (setCookie) pm.collectionVariables.set("sessionCookie", setCookie.split(";")[0]);',
    'pm.test("Сессия установлена", () => pm.expect(setCookie).to.include("asteroids.sid="));'])
request('03 GET список услуг с фильтром', 'GET', '/api/dates?maxMonth=7', 200, private=True)
request('04 POST черновик с картинкой и видео', 'POST', '/api/dates', 201, [
    {'key': 'designation', 'value': '{{designation}}', 'type': 'text'},
    {'key': 'image', 'type': 'file', 'src': 'public/assets/default-date.png'},
    {'key': 'video', 'type': 'file', 'src': 'public/assets/default-date.mp4'}], private=True, extra=[
    'pm.collectionVariables.set("publishedId", pm.response.json().data.id);',
    'pm.test("Автор из сессии", () => pm.expect(pm.response.json().data.isCreator).to.eql(1));'])
request('05 GET поля собственного черновика', 'GET', '/api/dates/draft', 200, private=True)
request('06 PUT публикация услуги', 'PUT', '/api/dates/publish', 200, publication, private=True, extra=[
    'const data = pm.response.json().data;',
    'pm.test("Статус и дата формирования обновились", () => { pm.expect(data.status).to.eql("published"); pm.expect(data.formedAt).to.be.a("string"); });',
    'pm.test("Поля публикации обновились", () => { pm.expect(data.approachMonth).to.eql(10); pm.expect(data.approachDay).to.eql(18); pm.expect(data.minimumDistanceAu).to.eql(0.023); });'])
request('07 GET лента (без id или с id и next=true)', 'GET', '/api/dates/feed', 200)
items[-1]['request']['url'] = {
    'raw': '{{baseUrl}}/api/dates/feed', 'host': ['{{baseUrl}}'], 'path': ['api', 'dates', 'feed'],
    'query': [{'key': 'id', 'value': '{{publishedId}}', 'disabled': True},
              {'key': 'next', 'value': 'true', 'disabled': True}]}
items[-1]['request']['description'] += ' Без параметров — первая карточка; включите id и next=true в Params для следующей. Это один GET-метод.'
request('08 POST поставить или снять лайк', 'POST', '/api/dates/{{publishedId}}/like', 200, {'like': 1}, private=True)
items[-1]['request']['description'] += ' Меняйте like: 1 — поставить, 0 — снять. Это один POST-метод.'
request('09 DELETE собственная услуга', 'DELETE', '/api/dates/{{publishedId}}', 200, private=True)
request('10 POST выход', 'POST', '/api/users/logout', 200, private=True)

from collections import Counter
assert len(items) == 10
assert Counter(item['request']['method'] for item in items) == {'GET': 3, 'POST': 5, 'PUT': 1, 'DELETE': 1}
for lab, collection_id in [(4, '958b1ade-7480-47f4-9ac5-fb7f99502314')]:
    save(f'postman/LR{lab}_Asteroid_Dates.postman_collection.json', {
        'info': {'_postman_id': collection_id, 'name': f'ЛР{lab} Asteroid Dates',
                 'schema': 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
                 'description': 'Ровно 10 запросов: 3 GET, 5 POST, 1 PUT, 1 DELETE. Для текущего бэкенда сначала выполните регистрацию и вход (01–02) или вставьте cookie из Swagger в sessionCookie и начните с 03. Рабочая папка Postman для файлов — корень репозитория. В единственном запросе ленты включайте/выключайте параметры id и next=true; в единственном запросе лайка меняйте like на 1 или 0. Для демонстрации гостя очистите sessionCookie и повторите тот же запрос списка/публикации, затем верните cookie. У всех запросов Disable cookie jar включён.'},
        'variable': [{'key': k, 'value': v} for k,v in {
            'baseUrl': 'http://localhost:3000', 'email': f'lab{lab}-observer@example.com',
            'password': 'AsteroidLab4!', 'fullName': f'Наблюдатель ЛР{lab}',
            'designation': f'2026 LAB{lab}', 'sessionCookie': '', 'publishedId': ''}.items()],
        'item': items})

# StarUML uses references to shared operations, not duplicate text labels.
counter = 0
all_elements = {}
def element(kind, parent=None, **values):
    global counter
    counter += 1
    item = {'_type': kind, '_id': f'lr4-{counter:04d}'}
    if parent: item['_parent'] = ref(parent)
    item.update(values)
    all_elements[item['_id']] = item
    return item

def ref(item): return {'$ref': item['_id']}

project = element('Project', name='Asteroid Dates — ЛР4', ownedElements=[])
model = element('UMLModel', project, name='Asteroid Dates Backend', ownedElements=[])
project['ownedElements'].append(model)
classes = {}
operations = {}
class_defs = {
    'BrowserSPA': ([], [('receiveResponse', 'status: number, data: JSON')]),
    'ApiUsersController': ([], [('register', 'body: RegisterUserDto'), ('authenticate', 'body: AuthUserDto'), ('logout', '')]),
    'ApiDatesController': ([], [('listPublishedDates', 'maxMonth: number'), ('getFeedDate', 'id: number, next: boolean'), ('getCurrentDraft', ''), ('createDraft', 'body: CreateDateDto, files: Media'), ('publishDraft', 'body: PublishDateDto'), ('setLike', 'id: number, body: LikeDateDto'), ('deleteDate', 'id: number')]),
    'AuthService': ([], [('register', 'fullName: string, email: string, password: string'), ('authenticate', 'email: string, password: string')]),
    'DatesService': ([], [('getPublishedDates', 'maxMonth: number'), ('getPublishedFeedDate', 'options: FeedOptions'), ('getDraftForCurrentObserver', ''), ('createDraftForCurrentObserver', 'input: CreateDraftInput'), ('publishDraftForCurrentObserver', 'input: PublishDraftInput'), ('setLikeForCurrentObserver', 'id: number, like: number'), ('deleteDateForCurrentObserver', 'id: number')]),
    'DateMediaStorageService': ([], [('saveDateMedia', 'kind: string, file: UploadedDateMediaFile')]),
    'CurrentObserverService': ([], [('get', ''), ('require', '')]),
    'Observer': (['id: number', 'fullName: string', 'email: string', 'passwordHash: string'], []),
    'AsteroidDate': (['id: number', 'designation: string', 'shortDescription: string', 'status: DateStatus', 'creatorId: number', 'createdAt: Date', 'formedAt: Date', 'approachMonth: number', 'approachDay: number', 'minimumDistanceAu: number', 'imageUrl: string', 'videoUrl: string'], []),
    'ObserverDateLike': (['id: number', 'observerId: number', 'asteroidDateId: number'], [])
}
for name, (attrs, ops) in class_defs.items():
    cls = element('UMLClass', model, name=name, attributes=[], operations=[], ownedElements=[])
    classes[name] = cls; model['ownedElements'].append(cls)
    for text in attrs:
        attrname, typ = text.split(': ')
        cls['attributes'].append(element('UMLAttribute', cls, name=attrname, type=typ, visibility='public'))
    for opname, params in ops:
        op = element('UMLOperation', cls, name=opname, visibility='public', parameters=[])
        cls['operations'].append(op); operations[name,opname] = op
        for param in params.split(', ') if params else []:
            paramname, typ = param.split(': ')
            op['parameters'].append(element('UMLParameter', op, name=paramname, type=typ, direction='in'))

FONT = 'Arial;12;0'
def label(parent, text='', kind='LabelView', **values):
    return element(kind, parent, font=FONT, text=text, **values)

def name_comp(parent, title):
    comp = element('UMLNameCompartmentView', parent, font=FONT, subViews=[])
    for field, text in [('stereotypeLabel',''), ('nameLabel',title), ('namespaceLabel',''), ('propertyLabel','')]:
        lab = label(comp, text, visible=bool(text)); comp['subViews'].append(lab); comp[field] = ref(lab)
    return comp

cd = element('UMLClassDiagram', model, name='01 Классы — операции для signature', defaultDiagram=False, ownedViews=[])
model['ownedElements'].append(cd)
classviews = {}
for index, (name, cls) in enumerate(classes.items()):
    x = 40 + (index % 3) * 480; y = 40 + (index // 3) * 340
    view = element('UMLClassView', cd, model=ref(cls), left=x, top=y, width=445, height=max(100, 65 + 20 * (len(cls['attributes']) + len(cls['operations']))),
                   font=FONT, fillColor='#f1f5fb', subViews=[], showOperationSignature=True)
    comp = name_comp(view, name); view['nameCompartment'] = ref(comp); view['subViews'].append(comp)
    for field, compkind, entries, rowkind in [
        ('attributeCompartment','UMLAttributeCompartmentView',cls['attributes'],'UMLAttributeView'),
        ('operationCompartment','UMLOperationCompartmentView',cls['operations'],'UMLOperationView'),
        ('receptionCompartment','UMLReceptionCompartmentView',[],'UMLReceptionView'),
        ('templateParameterCompartment','UMLTemplateParameterCompartmentView',[],'UMLTemplateParameterView')]:
        part = element(compkind, view, model=ref(cls), font=FONT, subViews=[])
        for entry in entries:
            part['subViews'].append(element(rowkind, part, model=ref(entry), font=FONT))
        view[field] = ref(part); view['subViews'].append(part)
    cd['ownedViews'].append(view); classviews[name] = view

# Include actual associations/dependencies on the class diagram.
for source, target in [('ApiUsersController','AuthService'), ('ApiUsersController','CurrentObserverService'), ('ApiDatesController','DatesService'), ('ApiDatesController','DateMediaStorageService'), ('DatesService','CurrentObserverService'), ('DatesService','AsteroidDate'), ('DatesService','ObserverDateLike'), ('AuthService','Observer'), ('AsteroidDate','Observer'), ('ObserverDateLike','Observer'), ('ObserverDateLike','AsteroidDate')]:
    dependency = element('UMLDependency', classes[source], source=ref(classes[source]), target=ref(classes[target]))
    classes[source]['ownedElements'].append(dependency)
    sv, tv = classviews[source], classviews[target]
    cd['ownedViews'].append(element('UMLDependencyView', cd, model=ref(dependency), tail=ref(sv), head=ref(tv), lineStyle=1,
                                    points=f"{sv['left']+220}:{sv['top']+50};{tv['left']+220}:{tv['top']+50}", font=FONT))

scenario = element('UMLCollaboration', model, name='Сценарий публикации астероида', attributes=[], ownedElements=[])
model['ownedElements'].append(scenario)
interaction = element('UMLInteraction', scenario, name='HTTP бизнес-процесс SPA', participants=[], messages=[], ownedElements=[])
scenario['ownedElements'].append(interaction)
sd = element('UMLSequenceDiagram', interaction, name='02 Sequence — HTTP и домены', defaultDiagram=True, ownedViews=[],
             showSequenceNumber=True, sequenceNumbering='custom', showSignature=True, showActivation=False)
interaction['ownedElements'].append(sd)
lifelines = {}; lineviews = {}; xpos = {}
for index, (key, typ, display) in enumerate([
    ('spa','BrowserSPA','SPA'), ('users','ApiUsersController','users.asteroids.local'),
    ('auth','AuthService','Аутентификация'), ('dates','ApiDatesController','api.asteroids.local'),
    ('media','DateMediaStorageService','Медиа'), ('domain','DatesService','Даты астероидов')]):
    role = element('UMLAttribute', scenario, name=key, type=ref(classes[typ])); scenario['attributes'].append(role)
    line = element('UMLLifeline', interaction, name=display, represent=ref(role)); interaction['participants'].append(line)
    x = 190 + index * 500; xpos[key]=x
    view = element('UMLSeqLifelineView', sd, model=ref(line), font=FONT, left=x-170, top=35, width=340, height=2320, subViews=[])
    comp = name_comp(view, display); view['nameCompartment']=ref(comp); view['subViews'].append(comp)
    part = element('UMLLinePartView', view, model=ref(line), font=FONT, left=x, top=95, width=1, height=2260)
    view['subViews'].append(part); view['linePart']=ref(part)
    sd['ownedViews'].append(view); lifelines[key]=line; lineviews[key]=part

# All input AND output data live in Message.arguments. Every message signature references a class operation.
flows = [
 ('spa','users','ApiUsersController','authenticate','POST /api/users/auth; email, password','call'),
 ('users','auth','AuthService','authenticate','email, password','call'),
 ('auth','users','AuthService','authenticate','observer {id, fullName, email}','reply'),
 ('users','spa','ApiUsersController','authenticate','200; Set-Cookie: asteroids.sid; authenticated=1, observer','reply'),
 ('spa','dates','ApiDatesController','listPublishedDates','GET /api/dates?maxMonth=7; Cookie','call'),
 ('dates','domain','DatesService','getPublishedDates','maxMonth=7','call'),
 ('dates','spa','ApiDatesController','listPublishedDates','200; data=[published dates, isCreator, isLiked]','reply'),
 ('spa','dates','ApiDatesController','createDraft','POST /api/dates; multipart: designation, image, video; Cookie','call'),
 ('dates','media','DateMediaStorageService','saveDateMedia','image, imageFile -> imageUrl','call'),
 ('dates','media','DateMediaStorageService','saveDateMedia','video, videoFile -> videoUrl','call'),
 ('dates','domain','DatesService','createDraftForCurrentObserver','designation, imageUrl, videoUrl; creatorId из сессии','call'),
 ('dates','spa','ApiDatesController','createDraft','201; data={id, status=draft, creatorId, imageUrl, videoUrl}','reply'),
 ('spa','dates','ApiDatesController','getCurrentDraft','GET /api/dates/draft; Cookie','call'),
 ('dates','domain','DatesService','getDraftForCurrentObserver','observer из сессии -> собственный черновик','call'),
 ('dates','spa','ApiDatesController','getCurrentDraft','200; data={id, designation, поля черновика}','reply'),
 ('spa','dates','ApiDatesController','publishDraft','PUT /api/dates/publish; shortDescription, approachMonth=10, approachDay=18, minimumDistanceAu; Cookie','call'),
 ('dates','domain','DatesService','publishDraftForCurrentObserver','поля публикации; observer из сессии','call'),
 ('dates','spa','ApiDatesController','publishDraft','200; data={id, status=published, formedAt, обновлённые поля}','reply'),
 ('spa','dates','ApiDatesController','getFeedDate','GET /api/dates/feed; без id','call'),
 ('dates','domain','DatesService','getPublishedFeedDate','{} -> первая опубликованная дата','call'),
 ('dates','spa','ApiDatesController','getFeedDate','200; data=[первая карточка]','reply'),
 ('spa','dates','ApiDatesController','getFeedDate','GET /api/dates/feed?id=2&next=true','call'),
 ('dates','domain','DatesService','getPublishedFeedDate','{id=2, next=true} -> следующая дата','call'),
 ('dates','spa','ApiDatesController','getFeedDate','200; data=[следующая карточка]','reply'),
 ('spa','dates','ApiDatesController','setLike','POST /api/dates/2/like; like=1; Cookie','call'),
 ('dates','domain','DatesService','setLikeForCurrentObserver','id=2, like=1; observer из сессии','call'),
 ('dates','spa','ApiDatesController','setLike','200; data={like=1, date: {isLiked=1, likesCount}}','reply'),
]
for index, (source,target,cls,op,args,sort) in enumerate(flows):
    message = element('UMLMessage', interaction, name=op, source=ref(lifelines[source]), target=ref(lifelines[target]),
                      signature=ref(operations[cls,op]), arguments=args, messageSort='reply' if sort=='reply' else 'synchCall', sequenceNumber=str(index+1))
    interaction['messages'].append(message)
    y=145+index*78
    view = element('UMLSeqMessageView', sd, model=ref(message), font=FONT, tail=ref(lineviews[source]), head=ref(lineviews[target]),
                   lineStyle=1, points=f'{xpos[source]}:{y};{xpos[target]}:{y}', subViews=[])
    for field,distance in [('nameLabel',14), ('stereotypeLabel',28), ('propertyLabel',10)]:
        lab = label(view, kind='EdgeLabelView', hostEdge=ref(view), edgePosition=1, distance=distance, alpha=1.5707963267948966)
        view[field]=ref(lab); view['subViews'].append(lab)
    activation = element('UMLActivationView', view, model=ref(message), visible=False, font=FONT)
    view['activation']=ref(activation); view['subViews'].append(activation)
    sd['ownedViews'].append(view)

# Validate model integrity before writing the .mdj file.
def validate_refs(value):
    if isinstance(value,dict):
        if '$ref' in value: assert value['$ref'] in all_elements, value
        for child in value.values(): validate_refs(child)
    elif isinstance(value,list):
        for child in value: validate_refs(child)
validate_refs(project)
for message in interaction['messages']:
    assert all_elements[message['signature']['$ref']]['_type']=='UMLOperation'
    assert message['arguments']
save('docs/asteroid-dates-lab4.mdj', project)
print(f'Generated LR4 Postman collection ({len(items)} requests) and StarUML ({len(classes)} classes, {len(flows)} messages).')
