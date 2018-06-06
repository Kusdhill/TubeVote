# Define your tables below (or better in another model file) for example
#
# >>> db.define_table('mytable', Field('myfield', 'string'))
#
# Fields can be 'string','text','password','integer','double','boolean'
#       'date','time','datetime','blob','upload', 'reference TABLENAME'
# There is an implicit 'id integer autoincrement' field
# Consult manual for more options, validators, etc.

db.define_table('stream_session',
    Field('video_time'),
    Field('host_name'),
    Field('passphrase'),
    Field('users'),
    Field('playlist_url'),
    Field('playing')
)

# after defining tables, uncomment below to enable auditing
# auth.enable_record_versioning(db)