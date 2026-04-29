import json
try:
    json.loads('{"a": "b', strict=False)
except Exception as e:
    print(repr(e))
    
try:
    json.loads('{"a": "\nb"', strict=False)
except Exception as e:
    print(repr(e))

try:
    # unescaped quote?
    json.loads('{"a": "b"c"}', strict=False)
except Exception as e:
    print(repr(e))

try:
    # what if we use strict=True with newline?
    json.loads('{"a": "b\nc"}')
except Exception as e:
    print(repr(e))

try:
    # newline at the end of string inside?
    json.loads('{"a": "b\n"}')
except Exception as e:
    print(repr(e))
    
try:
    # python 3 json: if strict=True, and there's a raw newline BEFORE the closing quote, it gives Invalid control character!
    pass
