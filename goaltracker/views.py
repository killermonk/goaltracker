from django.http import HttpResponse
from django.utils.http import is_safe_url
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout

def index(request):
    return HttpResponse("Nothing to see here... yet.")

def login(request):
    redirect_to = request.POST.get('next', request.GET.get('next', ''))

    auth_logout(request)
    if request.method == "POST":
        user = authenticate(username=request.POST['username'], password=request.POST['password'])
        if user is not None:
            if user.is_active:
                auth_login(request, user)

                if not is_safe_url(url=redirect_to, host=request.get_host()):
                    redirect_to = 'index'

                return redirect(redirect_to)

    return render(request, 'login.html', {'next': redirect_to})
