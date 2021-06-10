
def validateUserName(username):
    if not username:
        return False
    return True

def validatePassword(pw):
    if not pw:
        return False
    return True

def validateQuestion(question):
    if not question:
        return False
    return True

def validateAnswer(answer):
    if not answer:
        return False
    return True

def validateAbout(About):
    if not About:
        return False
    if len(About) > 280:
        return False
    return True

def validateCommunityTitle(title):
    if not title:
        return False
    return True

def validateCommunityDesc(desc):
    if not desc:
        return False
    return True

def validateServer(server):
    listOfServers = ['cs3099user-a1.host.cs.st-andrews.ac.uk', 'cs3099user-a6.host.cs.st-andrews.ac.uk', 'cs3099user-a7.host.cs.st-andrews.ac.uk', 'nebula0.herokuapp.com', 'cs3099user-a9.host.cs.st-andrews.ac.uk', 'bc89.host.cs.st-andrews.ac.uk', 'asp9@host.cs.st-andrews.ac.uk']
    if server not in listOfServers:
        return False
    return True