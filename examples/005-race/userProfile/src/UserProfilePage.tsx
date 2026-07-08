import React from 'react';

type UserProfile = { id: string; name: string };

type Props = {
  userId: string;
  getUserProfile: (userId: string) => Promise<UserProfile>;
};

export default function UserPageProfile(props: Props) {
  const [userData, setUserData] = React.useState(null as UserProfile | null);

  React.useEffect(() => {
    let canceled = false;
    const fetchUser = async () => {
      setUserData(null); // reset on fetch
      const data = await props.getUserProfile(props.userId);
      if (!canceled) setUserData(data);
    };
    fetchUser();
    return () => {
      canceled = true;
    };
  }, [props.getUserProfile, props.userId]);

  if (userData === null) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="user-id">Id: {userData.id}</div>
      <div data-testid="user-name">Name: {userData.name}</div>
    </div>
  );
}
