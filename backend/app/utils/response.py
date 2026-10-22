from flask import jsonify


def api_response(data=None, message="Success", status_code=200, **kwargs):
    """Generate a consistent JSON success response format."""
    payload = {
        "success": True,
        "message": message,
        "data": data,
    }
    payload.update(kwargs)
    return jsonify(payload), status_code


def api_error(message="An error occurred", status_code=400, errors=None):
    """Generate a consistent JSON error response format."""
    payload = {
        "success": False,
        "message": message,
    }
    if errors is not None:
        payload["errors"] = errors
    return jsonify(payload), status_code
