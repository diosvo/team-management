"""
Router dependencies of `auth` module.

Pydantic can only validate the values from client input. 
Use dependencies to validate data against database constraints.

e.g. Email already exists, User not found, etc.
"""
