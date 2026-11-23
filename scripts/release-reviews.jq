if type != "array" or any(.[]; type != "array") then
  error("expected pages of pull request reviews")
else
  [ .[][] | select((.user.id | type) == "number" and .user.id != $author
      and (.submitted_at | type == "string")
      and (.submitted_at | test("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"))
      and ($until == "" or .submitted_at <= $until)
      and (.state | IN("APPROVED", "CHANGES_REQUESTED", "DISMISSED"))) ]
  | group_by(.user.id)
  | map(sort_by(.submitted_at, .id) | last
      | select(.state == "APPROVED" and .commit_id == $head
          and (.author_association | IN("OWNER", "MEMBER", "COLLABORATOR"))))
end
