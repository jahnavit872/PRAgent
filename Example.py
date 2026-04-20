def case_1_all_three_present():

    user_id = request.args.get('id')

    query = f"SELECT * FROM users WHERE id = {user_id}"

    cursor.execute(query)

    email = request.form['email']

    sql = "DELETE FROM accounts WHERE email = '" + email + "'"

    db.execute(sql)

    name = user_input

    query = "UPDATE users SET name = '{}'".format(name)

    cursor.executemany(query)

    order_id = get_param('order')

    query = "INSERT INTO logs VALUES ('%s', '%s')" % (order_id, timestamp)

    db.query(query)

 