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
    row = db(db.stream_session.passphrase == passphrase).select()
    print(row[0])
    
    session = dict(
        host_name=row[0].host_name,
        users=row[0].users,
        playlist_url=row[0].playlist_url,
        video_time=row[0].video_time
    )



    return response.json(dict(session=session))