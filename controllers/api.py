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