
export const buildVectorAccessFilter = (user) => {
  if (user.role === "admin") {
    return undefined;
  }

  const conditions = [
    { "metadata.uploadedBy": user._id },
  ];

  if (user.department) {
    conditions.push({
      "metadata.department": user.department,
    });
  }

  return {
    $or: conditions,
  };
};

export const buildAtlasSearchAccessFilter = (user) => {
  if (user.role === "admin") {
    return [];
  }

  const shouldConditions = [
    {
      equals: {
        path: "metadata.uploadedBy",
        value: user._id,
      },
    },
  ];

  if (user.department) {
    shouldConditions.push({
      equals: {
        path: "metadata.department",
        value: user.department,
      },
    });
  }

  return [
    {
      compound: {
        should: shouldConditions,
        minimumShouldMatch: 1,
      },
    },
  ];
};
