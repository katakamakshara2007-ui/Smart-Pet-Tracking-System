import os
from app import create_app

app = create_app(os.getenv("FLASK_ENV", "development"))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "True").lower() == "true"

    print("=" * 70)
    print(" Smart Pet Tracking and Escape Prediction System")
    print(" Anurag University - Department of Data Science")
    print(f" Flask Backend Server running at http://localhost:{port}")
    print("=" * 70)

    app.run(host=host, port=port, debug=debug)
