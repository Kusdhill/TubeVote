from __future__ import absolute_import, division, print_function

from stripe import oauth, util
from stripe.api_resources.abstract import CreateableAPIResource
from stripe.api_resources.abstract import DeletableAPIResource
from stripe.api_resources.abstract import UpdateableAPIResource
from stripe.api_resources.abstract import ListableAPIResource
from stripe.api_resources.abstract import nested_resource_class_methods

from stripe.six.moves.urllib.parse import quote_plus


@nested_resource_class_methods(
    'external_account',
    operations=['create', 'retrieve', 'update', 'delete', 'list']
)
@nested_resource_class_methods('login_link', operations=['create'])
class Account(CreateableAPIResource, ListableAPIResource,
              UpdateableAPIResource, DeletableAPIResource):
    OBJECT_NAME = 'account'

    @classmethod
    def retrieve(cls, id=None, api_key=None, **params):
        instance = cls(id, api_key, **params)
        instance.refresh()
        return instance

    @classmethod
    def modify(cls, id=None, **params):
        return cls._modify(cls._build_instance_url(id), **params)

    @classmethod
    def _build_instance_url(cls, sid):
        if not sid:
            return "/v1/account"
        sid = util.utf8(sid)
        base = cls.class_url()
        extn = quote_plus(sid)
        return "%s/%s" % (base, extn)

    def instance_url(self):
        return self._build_instance_url(self.get('id'))

    def reject(self, idempotency_key=None, **params):
        url = self.instance_url() + '/reject'
        headers = util.populate_headers(idempotency_key)
        self.refresh_from(self.request('post', url, params, headers))
        return self

    def deauthorize(self, **params):
        params['stripe_user_id'] = self.id
        return oauth.OAuth.deauthorize(**params)
