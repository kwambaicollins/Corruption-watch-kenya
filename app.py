from flask import Flask, request, jsonify
import pickle

app = Flask(__name__)
vectorizer, model = pickle.load(open("prioritization_model.pkl", "rb"))

@app.route("/predict-priority", methods=["POST"])
def predict():
    data = request.get_json()
    desc = data.get("description", "")
    vec = vectorizer.transform([desc])
    pred = int(model.predict(vec)[0])
    return jsonify({"priority": pred})

if __name__ == "__main__":
    app.run(debug=True)
