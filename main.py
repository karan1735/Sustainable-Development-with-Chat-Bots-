global_user1=""
global_user2=""
from contextvars import Context
import mysql.connector
from datetime import datetime
import logging
from telegram import ForceReply, ReplyKeyboardMarkup, ReplyKeyboardRemove, Update, User ,InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
    CallbackQueryHandler,
    CallbackContext,
    Updater
)
mydb=mysql.connector.connect(
    host="localhost",
    user="root",
    password="hariprasad@1307",
    database="mydb"
)
mycursor=mydb.cursor()
sql="INSERT INTO SUSTAINABLE1(complaint_number,user_id,firstname,lastname,issue,location,photo_link,description_issue,status_issue,date_of_complaint,time_of_complaint) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
global complaint_number
complaint_number=0
global target_user_id
global y
y=0
j=0
# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
# set higher logging level for httpx to avoid all GET and POST requests being logged
logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

ISSUE, PHOTO, LOCATION, DESCRIBE,COMPLAINT_NUMBER_INPUT,FINISHED,COMPLAINT,REUPDATE,FINISHED1= range(9)
global list_of_address1
global list_of_address2
global list_of_address3
list_of_address1=list()
list_of_address2=list()
list_of_address3=list()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts the conversation and asks the user about their gender."""
    reply_keyboard = [["Civil maintenance", "Electrical maintenance", "Furniture maintenance"]]
    
    await update.message.reply_text(
        "Hi!  I am maintainance bot.I will be used to help your issues...\n\n note you can use these commands:\n\nuse /done command to view the status of the complained issue\n\n use /complaint to complaint issue"
        "\n\nCHOOSE THE COMMAND TO PERFORM ACTION..."
    )

    return COMPLAINT

async def first_complaint(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts the conversation and asks the user about their gender."""
    reply_keyboard = [["Civil maintenance", "Electrical maintenance", "Furniture maintenance"]]
    
    await update.message.reply_text(
        "Hi!  I am maintainance bot.I will be used to help your issues...\n\n note you can use these commands:\n\nuse /done command to view the status of the complained issue\n\n use /complaint to complaint issue"
        "\n\nselect the type of issue you would like to complaint?",
        reply_markup=ReplyKeyboardMarkup(
            reply_keyboard, one_time_keyboard=True, input_field_placeholder="Civil maintenance or electrical Maintenance or Furniture maintanence?"
        ),
    )

    return ISSUE



async def recomplaint(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Starts the conversation and asks the user about their gender."""
    reply_keyboard = [["Civil maintenance", "Electrical maintenance", "Furniture maintenance"]]
    
    await update.message.reply_text(
        "Hi!  I am maintainance bot.I will be used to help your issues...\n\n NOTE you can use these commands:\n\nUse /done command to view the status of the complained issue\n\n Use /complaint to complaint issue"
        "\n\nselect category?",
        reply_markup=ReplyKeyboardMarkup(
            reply_keyboard, one_time_keyboard=True, input_field_placeholder="Civil maintenance or Electrical Maintenance or Furniture maintanence?"
        ),
    )

    return ISSUE




async def issue(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Stores the selected gender and asks for a photo."""
    user = update.message.from_user
    global global_user1
    global_user1=update.message.text
    global address1
    address1=user.id
    print(address1)
    await update.message.reply_text(global_user1)
    print(global_user1)

    logger.info("Gender of %s: %s", user.first_name, update.message.text)
    reply_keyboard = [["IT park", "S&H", "mech"]]
    
    await update.message.reply_text(
        "I see! Please send me the block , "
        ,
        reply_markup=ReplyKeyboardMarkup(
            reply_keyboard, one_time_keyboard=True, input_field_placeholder="IT park or S&H or mech?"
        ),
    )
    
    
    return LOCATION

async def location1(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    global global_user2
    global_user2=update.message.text
    print(global_user2)
    await update.message.reply_text(global_user2)
    user=update.message.from_user
    reply_keyboard = [["IT park", "S&H", "mech"]]
    logger.info("location of %s: %s", user.first_name, update.message.text)
    await update.message.reply_text(
        "I see! Please send me a Photo of the issue for further action, "
        "So I would know how its look like, ",
        reply_markup=ReplyKeyboardRemove(),
    )
    rf"%user%"
    return PHOTO


async def photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Stores the photo and asks for a location."""
    user = update.message.from_user
    global photo_file
    photo_file = await update.message.photo[-1].get_file()
    await update.message.reply_text(photo_file.file_path)
    await photo_file.download_to_drive("image1.jpeg")
    logger.info("Photo of %s: %s", user.first_name, "image1.jpeg")
    await update.message.reply_html(
        rf"Hi {user.mention_html()}!",
        reply_markup=ForceReply(selective=True),
    )
    await update.message.reply_text(
        "Describe the issue with specific location with full address \nExample : bulb not working in g01,S&h block.."
    )

    return DESCRIBE
i=0
def increment():
    global i
    i=i+1

def incrementof():
    global j
    j=j+1
def incrementofy():
    global y
    y=y+1

def complaint():
    global complaint_number
    complaint_number=complaint_number+1

y=0
async def handle_callback_query1(update: Update, context: CallbackContext) -> None:
    query = update.callback_query
    global i
    global y
    global list_of_message_text
    option=query.data
    if option=="take_action":
        keyboard = [
            [InlineKeyboardButton("Work finished", callback_data="work_done")],
        ]

        reply_markup = InlineKeyboardMarkup(keyboard)
    # CallbackQueries need to be answered, even if no notification to the user is needed
    # Some clients may have trouble otherwise. See https://core.telegram.org/bots/api#callbackquery
        await query.answer()
        print(list_of_message_text[0])
        print(y)
        await query.edit_message_text(text=list_of_message_text[0], reply_markup=reply_markup)
        y=y+1
        message = await context.bot.send_message(chat_id=list_of_address1[i], text="Thanks for noting us we will rectify it soon\n\nUse /done command to track the complaint ")
        increment()

    if option=="work_done":
        await query.edit_message_text(text=f"Work finished")
        

    if option=="inappropriate":
        await query.edit_message_text(text="The provided information is inappropriate")
        message = await context.bot.send_message(chat_id=list_of_address1[i], text="The given input is inappropriate..Start from first use /complaint")
        increment()
        
        

    if option=="workdone":
        print("hello")
        message = await context.bot.send_message(chat_id=list_of_address1[i], text="the work is done,It's my pleasure to help you...")
        increment()
        return ConversationHandler.END

    if option=="worknotdone":
        
        message = await context.bot.send_message(chat_id=list_of_address1[i], text="sorry we still require some time to finish the job,try again later")
        increment()
        





async def forward_user_info(user: User, description: str, context: CallbackContext) -> None:
    global list_of_message_text
    global complaint_number
    list_of_message_text=list()
    target_user_id = """ID YOU WANT TO SEND"""
    """6920157931"""
    context.user_data['original_user_id'] = target_user_id
    message_text = f"User ID: {user.id}\nUsername: {user.username}\nFirst Name: {user.first_name}\nLast Name: {user.last_name}\nComplaint number:{complaint_number}\n\nDescription: {description}"

    keyboard = [[InlineKeyboardButton("Take Action", callback_data='take_action'),
                InlineKeyboardButton("Inappropriate", callback_data='inappropriate')]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    # Forward user information to the target user with inline keyboard
    message = await context.bot.send_message(chat_id=target_user_id, text=message_text, reply_markup=reply_markup)
    message1 = await context.bot.send_message(chat_id=target_user_id, text=photo_file.file_path)
    list_of_message_text.append(message_text)
    st=str(user.id)
    val=(str(complaint_number),str(st),str(user.first_name),str(user.last_name),str(global_user1),str(global_user2),str(photo_file.file_path),str(description),"pending",datetime.now().date(),datetime.now().time())
    
    mycursor.execute(sql,val)
    mydb.commit()
    print(mycursor.rowcount,"record inserted")
    context.user_data['original_user_id'] = user.id
    list_of_address1.append(user.id)
    print(address1)
    print(user.id)
    print(list_of_address1[i])
    
    # Store the message ID for future reference if needed
    context.user_data['message_id'] = message.message_id
 
def complaint_number_check():
    global complaint_number 
    query=f"SELECT * FROM SUSTAINABLE1 WHERE COMPLAINT_NUMBER ='{complaint_number}'"
    mycursor.execute(query)
    result = mycursor.fetchone()
    if result is not None:
        complaint_number=complaint_number+11
        complaint_number=complaint_number_check()
    return complaint_number




async def describe(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Stores the info about the user and ends the conversation."""
    global description
    global complaint_number
    user1= update.message.from_user
    description=update.message.text
    complaint_number=complaint_number_check()
    logger.info("description of %s: %s", user1.first_name, update.message.text)
    message1=f"I will forward it to the concerned department...\n Your complaint number : {complaint_number}"
    await context.bot.send_message(chat_id=update.message.chat_id, text=message1)
    #await update.message.reply_text("I will forward it to the concerned department... your complaint number : ")
    
    await forward_user_info(user1, description, context)
    complaint()
    return COMPLAINT
    

    
async def done_command(update: Update,  context: CallbackContext) -> int:
    user_giving_complaint_number = update.message.text
    print(user_giving_complaint_number)
    query=f"SELECT status_issue FROM SUSTAINABLE1 WHERE complaint_number = '{user_giving_complaint_number}'"
    try:
        mycursor.execute(query)
        result=mycursor.fetchone()
        if result:
            if result[0] == "pending":
                
                await context.bot.send_message(chat_id=update.message.chat_id, text="It still requires some time to finish...")
                
            else:
                
                await context.bot.send_message(chat_id=update.message.chat_id, text=f"Complaint status is not pending. Current status: {result[0]}")
            
        else:
           
            await context.bot.send_message(chat_id=update.message.chat_id, text="Wrong complaint number, enter a valid complaint number.")
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        await context.bot.send_message(chat_id=update.message.chat_id, text="An error occurred while processing your request.")
    reply_keyboard = [["Civil maintenance", "Electrical maintenance", "Furniture maintenance"]]
    
    await update.message.reply_text(
        "Hi!  I am maintainance bot.I will be used to help your issues...\n\n Note you can use these commands:\n\nuse /done command to view the status of the complained issue\n\n use /complaint to complaint issue"
        "\n\nCHOOSE THE COMMAND TO PERFORM ACTION..."
    )

    return COMPLAINT
    


async def done_of_command(update: Update,context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Enter the complaint number")
    
    
    return COMPLAINT_NUMBER_INPUT


async def reupdate_command(update: Update,context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Enter the complaint number")
    return FINISHED


async def restricted_OF_command(update: Update,context: ContextTypes.DEFAULT_TYPE) -> int:
    admin_complaint_number=update.message.text
    query=f"SELECT COMPLAINT_NUMBER FROM SUSTAINABLE1 WHERE complaint_number = '{admin_complaint_number}'"
    try:
        mycursor.execute(query)
        result=mycursor.fetchone()
        if result:
            sql1=f"UPDATE SUSTAINABLE1 SET STATUS_ISSUE = 'WORK_FINISHED' WHERE COMPLAINT_NUMBER= '{admin_complaint_number}'"
            mycursor.execute(sql1)
            mydb.commit()
            
        else:
           
            await context.bot.send_message(chat_id=update.message.chat_id, text="Wrong complaint number, Enter a valid complaint number.")
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        await context.bot.send_message(chat_id=update.message.chat_id, text="An error occurred while processing your request.")
    return REUPDATE


   
async def restricted_command(update: Update,context: ContextTypes.DEFAULT_TYPE) -> int:
    allowed_user_ids = ["""USERS ID YOU WANT TO ALLOW"""]
    user_id = update.message.from_user.id


    if user_id in allowed_user_ids:
        await update.message.reply_text("Enter the complaint number")
        return FINISHED
    else:
        await context.bot.send_message(chat_id=update.message.chat_id, text="your not authorized to use this command.")
        return ConversationHandler.END
    

async def restricted1_OF_command(update: Update,context: ContextTypes.DEFAULT_TYPE) -> int:
    admin_complaint_number=update.message.text
    query=f"SELECT COMPLAINT_NUMBER FROM SUSTAINABLE1 WHERE complaint_number = '{admin_complaint_number}'"
    try:
        mycursor.execute(query)
        result=mycursor.fetchone()
        if result:
            sql1=f"UPDATE SUSTAINABLE1 SET STATUS_ISSUE = 'INAPPROPRIATE' WHERE COMPLAINT_NUMBER= '{admin_complaint_number}'"
            mycursor.execute(sql1)
            mydb.commit()
            
        else:
           
            await context.bot.send_message(chat_id=update.message.chat_id, text="Wrong complaint number, Enter a valid complaint number.")
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        await context.bot.send_message(chat_id=update.message.chat_id, text="An error occurred while processing your request.")
    return REUPDATE


   
async def restricted1_command(update: Update,context: ContextTypes.DEFAULT_TYPE) -> int:
    allowed_user_ids = ["""USER,ID YOU WANT TO ALLOW"""]
    user_id = update.message.from_user.id


    if user_id in allowed_user_ids:
        await update.message.reply_text("Enter the complaint number")
        return FINISHED1
    else:
        await context.bot.send_message(chat_id=update.message.chat_id, text="your not authorized to use this command.")
        return ConversationHandler.END

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancels and ends the conversation."""
    user = update.message.from_user
    logger.info("User %s canceled the conversation.", user.first_name)
    await update.message.reply_text(
        "Bye! I hope we can talk again some day.", reply_markup=ReplyKeyboardRemove()
    )

    return ConversationHandler.END





def main() -> None:
    """Run the bot."""
    # Create the Application and pass it your bot's token.
    application = Application.builder().token("TOKEN").build()

    # Add conversation handler with the states GENDER, PHOTO, LOCATION and BIO
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            ISSUE: [MessageHandler(filters.Regex("^(Civil maintenance|Electrical maintenance|Furniture maintenance)$"), issue)],
            
            LOCATION: [MessageHandler(filters.Regex("^(IT park|S&H|mech)$"), location1)],
            DESCRIBE:  [MessageHandler(filters.TEXT & ~filters.COMMAND, describe)],
           
            #FORWARD: [MessageHandler(filters.TEXT & ~filters.COMMAND),forward_user_info],
            #LOCATION: [
            #    MessageHandler(filters.LOCATION, location),
            #    CommandHandler("skip", skip_location),
            #],
            PHOTO: [MessageHandler(filters.PHOTO, photo)],
            COMPLAINT_NUMBER_INPUT: [MessageHandler(filters.TEXT & ~filters.COMMAND, done_command)],
            FINISHED: [MessageHandler(filters.TEXT & ~filters.COMMAND,restricted_OF_command )],
            FINISHED1: [MessageHandler(filters.TEXT & ~filters.COMMAND,restricted1_OF_command )],
            REUPDATE: [MessageHandler(filters.TEXT & ~filters.COMMAND,reupdate_command )],
            COMPLAINT:[MessageHandler(filters.TEXT & ~filters.COMMAND, first_complaint)],
            
        },
        fallbacks=[
        CommandHandler("cancel", cancel),
        CommandHandler("done", done_of_command),
        CommandHandler("update", restricted_command),
        CommandHandler("inappropriate", restricted1_command),
        CommandHandler("complaint",recomplaint)
        
    ],
        
    )
    
    application.add_handler(conv_handler)
    application.add_handler(CallbackQueryHandler(handle_callback_query1))
    
    # Run the bot until the user presses Ctrl-C
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
