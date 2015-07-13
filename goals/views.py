from django.http import HttpResponse

def goals(request):
    return HttpResponse("All goals")
