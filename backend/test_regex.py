import re
query1 = "What happened in incident 5?"
query2 = "can you show me incident #12 and incident 3"
query3 = "id 4"

def get_ids(q):
    # Match "incident X", "#X", "id X"
    matches = re.findall(r'(?:incident|#|id)\s*(\d+)', q.lower())
    return [int(m) for m in matches]

print(get_ids(query1))
print(get_ids(query2))
print(get_ids(query3))
