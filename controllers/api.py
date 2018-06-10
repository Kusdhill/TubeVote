import tempfile
import json

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

# Here go your api methods.
def new_session():
    stream_session = db.stream_session.insert(
        host_name=request.vars.host_name,
        passphrase=request.vars.passphrase,
        playlist_url=request.vars.playlist_url
    )
    sesh = db.stream_session(stream_session)
    return response.json(dict(session=sesh))

def get_session():
    print("getting session")

    passphrase = request.vars.passphrase
    print(passphrase)
    row = db(db.stream_session.passphrase == passphrase).select().first()
    print(row)
    #d = json.loads(row[0].videos)
    load =json.loads(row.videos)

    
    session = dict(
        host_name=row.host_name,
        users=row.users,
        playlist_url=row.playlist_url,
        video_time=row.video_time,
        videos=json.loads(row.videos)
    )

    return response.json(dict(session=session))

def guest_vote():
	print("guest vote")
	video_str = request.vars['videos[]']
	video_list = []

	for video in video_str:
		print(video)
		video_list.append(json.loads(video))

	#print(json.dumps(video_list))
	print("UPDATING")
	db(db.stream_session.passphrase == request.vars.passphrase).update(
		videos=json.dumps(video_list)
	)


def update_session():
	print("update_session")
	#print(request.vars)
	#print("\n")
	video_str = request.vars['videos[]']
	video_list = []
	for video in video_str:
		video_list.append(json.loads(video))

	#print(json.dumps(video_list))
	db(db.stream_session.passphrase == request.vars.passphrase).update(
		video_time=request.vars.video_time,
		videos=json.dumps(video_list)
	)
	#return response.json(dict())
