import base64

# Read the binary content of token.pickle
with open('token.pickle', 'rb') as file:
    binary_content = file.read()

# Encode it to base64
base64_encoded = base64.b64encode(binary_content).decode('utf-8')

# Print the encoded string
print(base64_encoded)

# Also save it to a file
with open('token_base64.txt', 'w') as file:
    file.write(base64_encoded)
