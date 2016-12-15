# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import json
import os
import re

from django.core import urlresolvers
from django.conf import settings
from django.http import HttpResponse
from django.test.client import Client
from mock import patch


NOINDEX_URLS = [
    r'^(404|500)/',
    r'^l10n_example/',
    r'.*%\(.*\).*',
    r'^media/',
    r'^robots\.txt$',
]


def update_sitemaps():
    client = Client()
    urls = {}
    excludes = [re.compile(r) for r in NOINDEX_URLS]

    # get_resolver is an undocumented but convenient function.
    # Try to retrieve all valid URLs on this site.
    for key, value in urlresolvers.get_resolver(None).reverse_dict.iteritems():
        path = value[0][0][0]
        # Exclude pages that we don't want be indexed by search engines.
        # Some other URLs are also unnecessary for the sitemap.
        if (not isinstance(key, basestring) or
                any(exclude.match(path) for exclude in excludes)):
            continue
        path = '/' + path
        # Send a request to each page. It takes a while to finish this process
        # but it's probably a reliable way to get complete data.
        with patch('lib.l10n_utils.django_render') as render:
            render.return_value = HttpResponse(status=200)
            response = client.get('/' + settings.LANGUAGE_CODE + path)
        # Exclude redirects
        if response.status_code != 200:
            continue
        # Retrieve the translation list from the context data
        if render.called:
            urls[path] = render.call_args[0][2]['translations'].keys()
        else:
            urls[path] = ['en-US']

    # Now the urls dictionary contains path/locales pairs like this:
    # {'/firefox/new/': ['ach', 'af', 'ak', 'an', 'ar', 'ast', ...]}

    # Output static files
    output_json(urls)


def output_json(urls):
    # Prepare a directory to save a JSON file
    output_dir = os.path.join(settings.ROOT, 'lib', 'sitemaps', 'json')
    if not os.path.isdir(output_dir):
        os.makedirs(output_dir)

    # Output the data as a JSON file for convenience
    with open(os.path.join(output_dir, 'urls.json'), 'w') as json_file:
        json.dump(urls, json_file)

    for url in sorted(urls.keys()):
        print url
