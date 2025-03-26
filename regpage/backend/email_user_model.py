# User Model Update
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    is_confirmed = Column(Boolean, default=False)  # Track email confirmation status
#You need to add a new column in your User model to track whether the user has confirmed their email.