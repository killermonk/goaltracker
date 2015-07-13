from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns('goals.api',
    url(r'^$', views.goals, name='goals')
)
