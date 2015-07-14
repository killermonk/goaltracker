from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns

from . import views

urlpatterns = [
    url(r'^$', views.GoalList.as_view()),
    url(r'^(?P<pk>[0-9]+)/$', views.GoalDetail.as_view()),

    url(r'^(?P<goal_id>[0-9]+)/logs/$', views.GoalLogsList.as_view()),
    url(r'^(?P<goal_id>[0-9]+)/logs/(?P<progress_date>\d{4}-\d{2}-\d{2})$', views.GoalLogsDetail.as_view()),
]

urlpatterns = format_suffix_patterns(urlpatterns)
