import pytest


@pytest.fixture
def client():
    import setup
    setup.app.config['TESTING'] = True
    return setup.app.test_client()
