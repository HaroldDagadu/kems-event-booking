# Make end_time non-nullable and remove duration_hours field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0003_populate_end_time'),
    ]

    operations = [
        # Make end_time non-nullable
        migrations.AlterField(
            model_name='bookingrequest',
            name='end_time',
            field=models.TimeField(help_text='The end time of the event'),
        ),
        # Remove the duration_hours field
        migrations.RemoveField(
            model_name='bookingrequest',
            name='duration_hours',
        ),
    ]