"""Generate only the LR3 collection, independently of the LR4 session-based API."""
from pathlib import Path
from collections import Counter
import json

root = Path(__file__).resolve().parents[1]
items = []

def request(name, method, route, description, expected=200, body=None, checks=()):
    headers = []
    req = {'method': method, 'header': headers, 'url': '{{baseUrl}}' + route,
           'description': description, 'auth': {'type': 'noauth'}}
    if body is not None:
        if isinstance(body, list):
            req['body'] = {'mode': 'formdata', 'formdata': body}
        else:
            headers.append({'key': 'Content-Type', 'value': 'application/json'})
            req['body'] = {'mode': 'raw', 'raw': json.dumps(body, ensure_ascii=False, indent=2), 'options': {'raw': {'language': 'json'}}}
    status = (f'pm.test("HTTP {expected}", () => pm.response.to.have.status({expected}));'
              if isinstance(expected, int) else 'pm.test("Создан или уже зарегистрирован", () => pm.expect([201,409]).to.include(pm.response.code));')
    items.append({'name': name, 'request': req, 'protocolProfileBehavior': {'disableCookies': True},
                  'event': [{'listen': 'test', 'script': {'type': 'text/javascript', 'exec': [status, *checks]}}]})

request('01 GET список с фильтрацией', 'GET', '/api/dates?maxMonth=7',
        'Домен услуги. Только опубликованные. maxMonth — верхняя граница месяца; isCreator=0/1 сравнивает автора с фиксированным текущим пользователем.',
        checks=['pm.test("Опубликованные услуги и признак автора", () => pm.response.json().data.forEach(date => { pm.expect(date.status).to.eql("published"); pm.expect([0,1]).to.include(date.isCreator); }));'])
request('02 GET лента', 'GET', '/api/dates/feed',
        'Домен услуги. Только опубликованные, isLiked=0/1. Без id — первая; включите id и next=true в Params для следующей. Один GET-метод.',
        checks=['const date=pm.response.json().data[0];', 'pm.collectionVariables.set("likeDateId", date.id);',
                'pm.test("Опубликованная карточка и признак лайка", () => { pm.expect(date.status).to.eql("published"); pm.expect([0,1]).to.include(date.isLiked); });'])
items[-1]['request']['url'] = {'raw': '{{baseUrl}}/api/dates/feed', 'host': ['{{baseUrl}}'], 'path': ['api','dates','feed'],
                            'query': [{'key':'id','value':'{{likeDateId}}','disabled':True}, {'key':'next','value':'true','disabled':True}]}
request('03 GET получение черновика без id', 'GET', '/api/dates/draft',
        'Домен услуги. Только черновик текущего пользователя, не более одной записи. id не передаётся; если черновика нет, data=null.')
request('04 POST добавление с изображением и видео', 'POST', '/api/dates',
        'Домен услуги. multipart/form-data: designation, image и video именно типа File. Сервер загружает байты в MinIO, генерирует латинские имена и сохраняет их в БД.',
        expected=201, body=[{'key':'designation','value':'2026 LAB3','type':'text'},
                           {'key':'image','type':'file','src':'public/assets/default-date.png'},
                           {'key':'video','type':'file','src':'public/assets/default-date.mp4'}],
        checks=['pm.collectionVariables.set("dateId", pm.response.json().data.id);',
                'pm.test("Собственный черновик", () => { const date=pm.response.json().data; pm.expect(date.status).to.eql("draft"); pm.expect(date.isCreator).to.eql(1); });'])
request('05 PUT публикация', 'PUT', '/api/dates/publish',
        'Домен услуги. Публикация собственного черновика: status=published и formedAt. Меняются только разрешённые поля.',
        body={'shortDescription':'Сближение астероида с Землёй','approachMonth':10,'approachDay':18,'minimumDistanceAu':0.023},
        checks=['pm.test("Статус опубликован", () => pm.expect(pm.response.json().data.status).to.eql("published"));'])
request('06 DELETE soft delete своей услуги', 'DELETE', '/api/dates/{{dateId}}',
        'Домен услуги. Только собственная карточка. Запись остаётся в БД со status=deleted; чужую удалить нельзя.')
request('07 POST like — 0 или 1', 'POST', '/api/dates/{{likeDateId}}/like',
        'Домен услуги. От фиксированного текущего пользователя. like=1 поставить, like=0 отменить. likeDateId берётся из ленты, а не из уже удалённой собственной карточки.',
        body={'like':1}, checks=['pm.test("Лайк установлен", () => pm.expect(pm.response.json().data.date.isLiked).to.eql(Number(JSON.parse(pm.request.body.raw).like)));'])
request('08 POST регистрация', 'POST', '/api/users/register',
        'Домен пользователя. Сохранение имени и email. В ЛР3 пароль и сессия для выполнения запросов не нужны.',
        expected=[201,409], body={'fullName':'Наблюдатель ЛР3','email':'{{email}}'})
request('09 POST аутентификация — заглушка', 'POST', '/api/users/auth',
        'Домен пользователя. Заглушка для 4-й лабораторной: не проверяет пароль, не устанавливает cookie и не меняет текущего пользователя.',
        body={'email':'{{email}}'}, checks=['pm.test("Заглушка без сессии", () => { pm.expect(pm.response.json().data.stub).to.eql(true); pm.expect(pm.response.headers.has("Set-Cookie")).to.eql(false); });'])
request('10 POST деавторизация — заглушка', 'POST', '/api/users/logout',
        'Домен пользователя. Заглушка для 4-й лабораторной. Возвращает authenticated=0, stub=true, текущий пользователь остаётся фиксированным.',
        checks=['pm.test("Заглушка выхода", () => { pm.expect(pm.response.json().data.stub).to.eql(true); pm.expect(pm.response.json().data.authenticated).to.eql(0); });'])

assert len(items) == 10
assert Counter(item['request']['method'] for item in items) == {'GET':3,'POST':5,'PUT':1,'DELETE':1}
collection = {
    'info': {'_postman_id':'9d793264-1b7f-4f47-a8e5-3efec0310003', 'name':'ЛР3 Asteroid Dates',
             'schema':'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
             'description':'ЛР3: ровно 10 методов по заданию, 3 GET + 5 POST + 1 PUT + 1 DELETE. Сначала npm run start:lab3 (localhost:3003), PostgreSQL и MinIO. Текущий пользователь фиксирован: id=1. Аутентификация и деавторизация — заглушки; cookie, JWT и пароль не нужны. Для файлов рабочая папка Postman — корень проекта. Поля image/video выбираются как File. Для следующей карточки измените Params того же запроса 02, для снятия лайка измените like на 0 в запросе 07. ЛР4 остаётся отдельной коллекцией на localhost:3000.'},
    'variable':[{'key':key,'value':value} for key,value in {'baseUrl':'http://localhost:3003','dateId':'','likeDateId':'','email':'lab3-observer@example.com'}.items()],
    'item':items
}
(root/'postman/LR3_Asteroid_Dates.postman_collection.json').write_text(json.dumps(collection,ensure_ascii=False,indent=2)+'\n')
print('ЛР3: 10 запросов — 3 GET, 5 POST, 1 PUT, 1 DELETE; вход и выход — заглушки.')
