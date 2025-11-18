import re

LETTER_MATCH_PATTERN = re.compile(r"[а-яА-Яa-zA-Z\-]+$")
PHONE_MATCH_PATTERN = re.compile(r"[0-9]{10}$")
