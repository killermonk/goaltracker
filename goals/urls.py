from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.goal_list),
    url(r'^(?P<goal_id>[0-9]+)/$', views.goal_detail),

    url(r'^(?P<goal_id>[0-9]+)/logs/$', views.goal_logs_list),
    url(r'^(?P<goal_id>[0-9]+)/logs/(?P<progress_date>\d{4}-\d{2}-\d{2})/$', views.goal_logs_detail),
]
