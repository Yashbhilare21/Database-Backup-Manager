from app.db.session import Base  # noqa
from app.models.user import User, Profile, UserRole  # noqa
from app.models.connection import DatabaseConnection  # noqa
from app.models.schedule import BackupSchedule  # noqa
from app.models.history import BackupHistory, RestoreHistory  # noqa
from app.models.storage import StorageConfiguration  # noqa
from app.models.notifications import Notification  # noqa

metadata = Base.metadata