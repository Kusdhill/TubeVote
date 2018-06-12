import tempfile
import json

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

# Here go your api methods.
def new_session():
    print("new_session")
    stream_session = db.stream_session.insert(
        host_name=request.vars.host_name,
        passphrase=request.vars.passphrase,
        playlist_url=request.vars.playlist_url
    )
    sesh = db.stream_session(stream_session)
    print(sesh)
    return response.json(dict(session=sesh))

### gets an updated session state
def get_update():
    print("getting update")
    passphrase = request.vars.passphrase
    row = db(db.stream_session.passphrase == passphrase).select().first()

    load =json.loads(row.videos)
    
    session = dict(
        host_name=row.host_name,
        playlist_url=row.playlist_url,
        video_time=row.video_time,
        videos=json.loads(row.videos),
        paused=row.paused,
        playing=row.playing
    )

    return response.json(dict(session=session))

### puts an updated session state in the database
def put_update():
	print("put_update")
	video_str = request.vars['videos[]']
	video_list = []
	for video in video_str:
		video_list.append(json.loads(video))

	db(db.stream_session.passphrase == request.vars.passphrase).update(
		video_time=request.vars.video_time,
		videos=json.dumps(video_list),
		paused=request.vars.paused,
		playing=request.vars.playing
	)
	#return response.json(dict())


def update_time():
	print("update_time")
	db(db.stream_session.passphrase == request.vars.passphrase).update(
		video_time=request.vars.video_time
	)